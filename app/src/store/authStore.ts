import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';

import i18n, {
  LANGUAGE_STORAGE_KEY,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from '@/i18n';
import { supabase } from '@/services/supabase';

export interface AuthResult {
  error: string | null;
}

export interface SetLanguageResult {
  ok: boolean;
  error?: string;
}

export interface AuthState {
  session: Session | null;
  user: User | null;
  // True until the first onAuthStateChange (or getSession bootstrap) settles.
  // Route guards must wait for this before deciding to redirect, otherwise a
  // cold start with a persisted session flashes the welcome screen.
  isLoading: boolean;
  // null = unknown/not yet fetched. Boolean once the user_profiles row has been read.
  onboardingCompleted: boolean | null;

  // Driven by the onAuthStateChange listener in app/_layout.tsx.
  setSession: (session: Session | null) => void;

  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string, name: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  refreshOnboardingStatus: () => Promise<void>;

  /**
   * Reads user_profiles.language for the current user and, if it differs from
   * the active i18n.language, applies it (i18n.changeLanguage + AsyncStorage
   * cache update). Called on every session change so the server is the
   * source of truth on the next sign-in after a cross-device language change.
   * No-op when the user is signed out or the profile has no language set.
   */
  syncLanguageFromProfile: () => Promise<void>;

  /**
   * Sets the UI language. Optimistic: applies to i18n + AsyncStorage cache
   * immediately so the UI flips within a frame, then writes to user_profiles
   * for the server source of truth. On DB failure the local change is
   * rolled back so the user isn't stranded with a UI/server mismatch on
   * next launch. Safe to call without a session — only the DB write is
   * skipped in that case.
   */
  setLanguage: (code: SupportedLanguage) => Promise<SetLanguageResult>;
}

function isSupportedLanguage(code: unknown): code is SupportedLanguage {
  return (
    typeof code === 'string' &&
    (SUPPORTED_LANGUAGES as readonly string[]).includes(code)
  );
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  isLoading: true,
  onboardingCompleted: null,

  setSession: (session): void => {
    set({
      session,
      user: session?.user ?? null,
      isLoading: false,
    });
    if (session) {
      void get().refreshOnboardingStatus();
      // Fire-and-forget. The UI already shows the cached/fallback language;
      // this only adjusts when the server disagrees.
      void get().syncLanguageFromProfile();
    } else {
      set({ onboardingCompleted: null });
    }
  },

  signIn: async (email, password): Promise<AuthResult> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    // Write state synchronously so the calling screen can read onboardingCompleted
    // immediately after the await — the onAuthStateChange listener races with us.
    set({ session: data.session, user: data.user });
    await get().refreshOnboardingStatus();
    // Run AFTER onboarding refresh — independent fetch, but ordered so the
    // calling screen sees onboarding state ready when it makes its routing
    // decision (language sync can finish in the background).
    void get().syncLanguageFromProfile();
    return { error: null };
  },

  signUp: async (email, password, name): Promise<AuthResult> => {
    // Trim defensively; the caller validates non-empty, but we don't want a
    // stray trailing space to land in user_metadata and surface in greetings.
    const trimmedName = name.trim();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name: trimmedName } },
    });
    if (error) return { error: error.message };

    // user_profiles + user_stats are created atomically by the on_auth_user_created
    // trigger (migration 005), so no client-side inserts are needed here.
    if (!data.session || !data.user) return { error: null };

    set({
      session: data.session,
      user: data.user,
      onboardingCompleted: false,
    });
    return { error: null };
  },

  signOut: async (): Promise<void> => {
    await supabase.auth.signOut();
    set({
      session: null,
      user: null,
      onboardingCompleted: null,
    });
    // Intentionally leave LANGUAGE_STORAGE_KEY in AsyncStorage so the
    // welcome / login screens render in the user's preferred language
    // through the sign-out → sign-back-in flow.
  },

  refreshOnboardingStatus: async (): Promise<void> => {
    const { user } = get();
    if (!user) {
      set({ onboardingCompleted: null });
      return;
    }
    const { data } = await supabase
      .from('user_profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .maybeSingle<{ onboarding_completed: boolean }>();
    set({ onboardingCompleted: data?.onboarding_completed ?? false });
  },

  syncLanguageFromProfile: async (): Promise<void> => {
    const { user } = get();
    if (!user) return;
    const { data, error } = await supabase
      .from('user_profiles')
      .select('language')
      .eq('id', user.id)
      .maybeSingle<{ language: string | null }>();
    if (error || !data) return;
    const serverLang = data.language;
    if (!isSupportedLanguage(serverLang)) return;
    if (serverLang === i18n.language) return;
    try {
      await i18n.changeLanguage(serverLang);
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, serverLang);
    } catch (err) {
      console.warn('[syncLanguageFromProfile] apply failed:', err);
    }
  },

  setLanguage: async (code): Promise<SetLanguageResult> => {
    const previous = i18n.language;
    if (code === previous) return { ok: true };

    // 1. Optimistic local apply — UI flips immediately.
    try {
      await i18n.changeLanguage(code);
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, code);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, error: msg };
    }

    // 2. Server write — only when signed in. The Profile screen lives behind
    //    a session gate so this branch normally runs; the guard keeps the
    //    action callable from any future pre-auth surface (e.g. a welcome
    //    language picker) without crashing.
    const { user } = get();
    if (!user) return { ok: true };

    const { error } = await supabase
      .from('user_profiles')
      .update({ language: code, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (error) {
      // 3. Roll back local apply so the user isn't stranded with the new UI
      //    but the old server value (which would silently revert on next
      //    session restore via syncLanguageFromProfile).
      try {
        if (isSupportedLanguage(previous)) {
          await i18n.changeLanguage(previous);
          await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, previous);
        }
      } catch (rollbackErr) {
        console.warn('[setLanguage] rollback failed:', rollbackErr);
      }
      return { ok: false, error: error.message };
    }

    return { ok: true };
  },
}));
