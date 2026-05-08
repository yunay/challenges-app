import { create } from 'zustand';

export type ChallengeCategory = 'health' | 'mental' | 'productivity' | 'social' | 'finance';
export type ChallengeDifficulty = 'easy' | 'medium' | 'hard';
export type ChallengeStatus = 'pending' | 'done' | 'skipped';
export type ChallengeFeedback = 'easy' | 'great' | 'too_hard' | 'not_applicable';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  category: ChallengeCategory;
  difficulty: ChallengeDifficulty;
  duration_min: number;
  points: number;
  is_main: boolean;
  status: ChallengeStatus;
  feedback: ChallengeFeedback | null;
  date: string;
}

export interface ChallengeState {
  today: {
    main: Challenge | null;
    bonus: Challenge[];
  };
  isLoading: boolean;
  setToday: (main: Challenge | null, bonus: Challenge[]) => void;
  setLoading: (loading: boolean) => void;
  markDone: (id: string) => void;
  setFeedback: (id: string, feedback: ChallengeFeedback) => void;
  reset: () => void;
}

const INITIAL_TODAY: ChallengeState['today'] = { main: null, bonus: [] };

export const useChallengeStore = create<ChallengeState>((set) => ({
  today: INITIAL_TODAY,
  isLoading: false,
  setToday: (main, bonus): void => set({ today: { main, bonus } }),
  setLoading: (loading): void => set({ isLoading: loading }),
  markDone: (id): void =>
    set((state) => ({
      today: {
        main: state.today.main?.id === id ? { ...state.today.main, status: 'done' } : state.today.main,
        bonus: state.today.bonus.map((c) => (c.id === id ? { ...c, status: 'done' } : c)),
      },
    })),
  setFeedback: (id, feedback): void =>
    set((state) => ({
      today: {
        main: state.today.main?.id === id ? { ...state.today.main, feedback } : state.today.main,
        bonus: state.today.bonus.map((c) => (c.id === id ? { ...c, feedback } : c)),
      },
    })),
  reset: (): void => set({ today: INITIAL_TODAY, isLoading: false }),
}));
