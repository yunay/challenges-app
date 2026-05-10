import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';

import { supabase } from '@/services/supabase';

export interface AuthResult {
  error: string | null;
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
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  refreshOnboardingStatus: () => Promise<void>;
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
    return { error: null };
  },

  signUp: async (email, password): Promise<AuthResult> => {
    const { data, error } = await supabase.auth.signUp({ email, password });
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
}));
