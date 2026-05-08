import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';

export interface AuthState {
  session: Session | null;
  user: User | null;
  isInitialized: boolean;
  setSession: (session: Session | null) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isInitialized: false,
  setSession: (session): void => set({ session, user: session?.user ?? null, isInitialized: true }),
  signOut: (): void => set({ session: null, user: null }),
}));
