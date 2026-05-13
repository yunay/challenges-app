import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';

import i18n, {
  LANGUAGE_STORAGE_KEY,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from '@/i18n';
import { setSentryUser } from '@/services/sentry';
import { supabase } from '@/services/supabase';

export interface AuthResult {
  error: string | null;
}

export interface SetLanguageResult {
  ok: boolean;
  error?: string;
}

export interface SetGoalsResult {
  ok: boolean;
  error?: string;
}

// 'other' is the catch-all; we deliberately don't store a separate
// 'prefer_not_to_say'. Matches the CHECK constraint on user_profiles.gender.
export const GENDER_VALUES = ['male', 'female', 'other'] as const;
export type Gender = (typeof GENDER_VALUES)[number];

export interface SetGenderResult {
  ok: boolean;
  error?: string;
}

export interface AccountActionResult {
  ok: boolean;
  error?: string;
}

// Grace window between soft-delete and hard-purge. Mirrors the
// `> NOW() - INTERVAL '30 days'` guard inside the restore_account RPC and
// the purge_deleted_accounts RPC — keep all three in sync if it ever changes.
export const DELETION_GRACE_DAYS = 30;

export interface AuthState {
  session: Session | null;
  user: User | null;
  // True until the first onAuthStateChange (or getSession bootstrap) settles.
  // Route guards must wait for this before deciding to redirect, otherwise a
  // cold start with a persisted session flashes the welcome screen.
  isLoading: boolean;
  // null = unknown/not yet fetched. Boolean once the user_profiles row has been read.
  onboardingCompleted: boolean | null;
  // ISO timestamp of the soft-delete request, or null if the account is
  // active. Read alongside onboarding_completed in a single round-trip.
  // The boot router gates on this to route into /restore during the grace
  // window. Symbol 'unknown' distinguishes "haven't fetched yet" from "active
  // (null in DB)" so app/index.tsx doesn't bounce the user prematurely.
  deletedAt: string | null | 'unknown';

  // Driven by the onAuthStateChange listener in app/_layout.tsx.
  setSession: (session: Session | null) => void;

  signIn: (email: string, password: string) => Promise<AuthResult>;
  /**
   * Creates the auth user (Supabase `signUp`) and, on success, writes the
   * chosen gender to user_profiles. The `handle_new_user` trigger creates
   * the profile row with column defaults; we follow up with an UPDATE
   * rather than extending that SECURITY DEFINER function to read metadata.
   * Gender write failures are surfaced like any other signUp error.
   */
  signUp: (
    email: string,
    password: string,
    name: string,
    gender: Gender,
  ) => Promise<AuthResult>;
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

  /**
   * Persists the user's chosen goals to user_profiles.goals. Caller is
   * expected to convert the survey-ID list to canonical DB values
   * (mapGoalToDbValue) before passing in. No client-side cache to update;
   * Settings reads goals on mount, so a successful write is enough.
   * On failure returns ok=false + error so the modal can stay open.
   */
  setGoals: (goals: string[]) => Promise<SetGoalsResult>;

  /**
   * Persists the user's gender to user_profiles.gender. Same shape as
   * setGoals / setLanguage; no client-side cache. AI generation reads the
   * column directly when building the next prompt.
   */
  setGender: (gender: Gender) => Promise<SetGenderResult>;

  /**
   * Soft-deletes the user account. Re-authenticates with the supplied
   * password first (Supabase signInWithPassword) — credential check, not a
   * new session — then calls the `request_account_deletion` RPC, then
   * signOut. On any error the modal stays open with the surfaced message;
   * the soft-delete only sticks if the entire chain succeeds.
   *
   * Wrong-password returns ok=false with a stable 'wrong_password' marker
   * so the modal can surface a localized message rather than the raw
   * Supabase error string.
   */
  requestAccountDeletion: (password: string) => Promise<AccountActionResult>;

  /**
   * Clears user_profiles.deleted_at via the restore_account RPC. The DB
   * function self-guards on the 30-day grace window — past-grace restores
   * are no-ops server-side. On success the store refreshes onboarding /
   * deletedAt so the boot router routes back into the normal flow.
   */
  restoreAccount: () => Promise<AccountActionResult>;
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
  deletedAt: 'unknown',

  setSession: (session): void => {
    set({
      session,
      user: session?.user ?? null,
      isLoading: false,
    });
    // Identify the user to Sentry by opaque id only — never email or name.
    // setSentryUser is a no-op if Sentry isn't initialised (no DSN).
    setSentryUser(session?.user.id ?? null);
    if (session) {
      void get().refreshOnboardingStatus();
      // Fire-and-forget. The UI already shows the cached/fallback language;
      // this only adjusts when the server disagrees.
      void get().syncLanguageFromProfile();
    } else {
      set({ onboardingCompleted: null, deletedAt: 'unknown' });
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

  signUp: async (email, password, name, gender): Promise<AuthResult> => {
    // Trim defensively; the caller validates non-empty, but we don't want a
    // stray trailing space to land in user_metadata and surface in greetings.
    const trimmedName = name.trim();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name: trimmedName, gender } },
    });
    if (error) return { error: error.message };

    // user_profiles + user_stats are created atomically by the on_auth_user_created
    // trigger (migration 005). The trigger writes column defaults, so gender
    // (added in migration 012, nullable) needs a follow-up UPDATE under the
    // new user's identity. Skipped when email-confirmation gates the session.
    if (!data.session || !data.user) return { error: null };

    const { error: profileErr } = await supabase
      .from('user_profiles')
      .update({ gender, updated_at: new Date().toISOString() })
      .eq('id', data.user.id);
    if (profileErr) return { error: profileErr.message };

    set({
      session: data.session,
      user: data.user,
      onboardingCompleted: false,
    });
    return { error: null };
  },

  signOut: async (): Promise<void> => {
    // Always clear local state, even if the Supabase round-trip fails
    // (network down, token already invalid, etc). Otherwise a failed
    // signOut would strand the user on Settings with session intact —
    // exactly the "logout button does nothing" bug we hit in testing.
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('[signOut] supabase signOut failed, clearing local state anyway:', err);
    }
    set({
      session: null,
      user: null,
      onboardingCompleted: null,
      deletedAt: 'unknown',
    });
    // Intentionally leave LANGUAGE_STORAGE_KEY in AsyncStorage so the
    // welcome / login screens render in the user's preferred language
    // through the sign-out → sign-back-in flow.
  },

  refreshOnboardingStatus: async (): Promise<void> => {
    const { user } = get();
    if (!user) {
      set({ onboardingCompleted: null, deletedAt: 'unknown' });
      return;
    }
    const { data } = await supabase
      .from('user_profiles')
      .select('onboarding_completed, deleted_at')
      .eq('id', user.id)
      .maybeSingle<{ onboarding_completed: boolean; deleted_at: string | null }>();
    set({
      onboardingCompleted: data?.onboarding_completed ?? false,
      deletedAt: data?.deleted_at ?? null,
    });
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

  setGoals: async (goals): Promise<SetGoalsResult> => {
    const { user } = get();
    if (!user) return { ok: false, error: 'Not signed in' };

    const { error } = await supabase
      .from('user_profiles')
      .update({ goals, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  },

  setGender: async (gender): Promise<SetGenderResult> => {
    const { user } = get();
    if (!user) return { ok: false, error: 'Not signed in' };

    const { error } = await supabase
      .from('user_profiles')
      .update({ gender, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  },

  requestAccountDeletion: async (password): Promise<AccountActionResult> => {
    const { user } = get();
    if (!user || !user.email) return { ok: false, error: 'Not signed in' };

    // Re-auth check. signInWithPassword refreshes the session under the
    // hood, but for our purposes we only care whether the credentials
    // resolve. A failure here is "wrong password" — surface a stable
    // marker so the caller can translate.
    const reauth = await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    });
    if (reauth.error) {
      return { ok: false, error: 'wrong_password' };
    }

    const { error: rpcErr } = await supabase.rpc('request_account_deletion');
    if (rpcErr) return { ok: false, error: rpcErr.message };

    // Sign the (now soft-deleted) user out. On their next sign-in the boot
    // router will see deleted_at and route to /restore.
    await get().signOut();
    return { ok: true };
  },

  restoreAccount: async (): Promise<AccountActionResult> => {
    const { user } = get();
    if (!user) return { ok: false, error: 'Not signed in' };

    const { error } = await supabase.rpc('restore_account');
    if (error) return { ok: false, error: error.message };

    // Refresh so the boot router sees deletedAt === null on the next render
    // and routes to the normal post-auth destination.
    await get().refreshOnboardingStatus();
    return { ok: true };
  },
}));
