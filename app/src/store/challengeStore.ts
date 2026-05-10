import { create } from 'zustand';

import { supabase } from '@/services/supabase';

export type ChallengeCategory = 'health' | 'mental' | 'productivity' | 'social' | 'finance';
export type ChallengeDifficulty = 'easy' | 'medium' | 'hard';
export type ChallengeStatus = 'pending' | 'done' | 'skipped';
export type ChallengeFeedback = 'easy' | 'great' | 'too_hard' | 'not_applicable';

export interface ChallengeContent {
  title: string;
  description: string;
  category: ChallengeCategory;
  difficulty: ChallengeDifficulty;
  duration_min: number;
  points: number;
}

export interface PersistResult {
  error: string | null;
}

export interface TodayChallenge {
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
}

export interface FetchTodayResult {
  data: TodayChallenge[];
  error: string | null;
}

export interface HistoryEntry {
  id: string;
  date: string; // 'YYYY-MM-DD'
  status: ChallengeStatus;
  title: string;
  category: ChallengeCategory;
}

export interface FetchHistoryResult {
  data: HistoryEntry[];
  error: string | null;
}

export interface UserStatsSnapshot {
  current_streak: number;
  longest_streak: number;
  total_points: number;
  d7_completion_rate: number;
  d30_completion_rate: number;
  total_challenges_done: number;
  total_challenges_seen: number;
}

const ZERO_STATS: UserStatsSnapshot = {
  current_streak: 0,
  longest_streak: 0,
  total_points: 0,
  d7_completion_rate: 0,
  d30_completion_rate: 0,
  total_challenges_done: 0,
  total_challenges_seen: 0,
};

export interface FetchStatsResult {
  error: string | null;
}

export interface ChallengeState {
  isPersisting: boolean;

  // Latest user_stats snapshot. null = not yet fetched in this session.
  // Refetch via fetchStats() — the trigger on challenges.update keeps the
  // row fresh server-side, so calling fetchStats() after markMainDone()
  // resolves picks up updated streak / points / rates / totals.
  stats: UserStatsSnapshot | null;

  // Main-challenge history rows for the most recently fetched range.
  // null = not yet fetched. HistoryScreen drives the range via fetchHistory.
  history: HistoryEntry[] | null;
  historyLoading: boolean;

  /**
   * Loads today's challenges for the current user and, the first time this
   * runs each day, increments user_stats.total_challenges_seen by the row
   * count. Idempotent across repeat calls within the same day — the bump is
   * gated on user_stats.last_active < today, which the call also advances.
   */
  fetchToday: () => Promise<FetchTodayResult>;

  /**
   * Persists today's main challenge as done.
   *
   * 1. Ensures user_stats exists (defensive — pre-trigger users may be missing
   *    the row, in which case the AFTER UPDATE trigger on challenges would
   *    silently no-op when it tries to UPDATE user_stats).
   * 2. Looks up today's main challenge row for the current user.
   * 3. If absent, inserts it with status='pending' (using the supplied content).
   * 4. Updates the row to status='done', completed_at=now() — this fires
   *    sync_user_stats_on_challenge_update which handles streak + points + rates.
   */
  markMainDone: (content: ChallengeContent) => Promise<PersistResult>;

  /**
   * Records the user's feedback against the main challenge identified by
   * `challengeId`. Validates the input value before sending so a bad caller
   * can't bypass the DB CHECK constraint and cause an opaque PG error.
   * Last write wins — re-tapping with a different value overwrites.
   */
  setMainFeedback: (challengeId: string, feedback: ChallengeFeedback) => Promise<PersistResult>;

  /**
   * Fetches the full user_stats snapshot for the signed-in user. Missing rows
   * (pre-trigger users, fresh accounts) resolve to an all-zeros snapshot
   * instead of erroring, so callers can render unconditionally.
   */
  fetchStats: () => Promise<FetchStatsResult>;

  /**
   * Loads main-challenge history for the inclusive date range
   * [monthStart, monthEnd]. Used by HistoryScreen to drive the calendar grid
   * and the last-7-days list. Bonus rows are excluded — history is "did you
   * keep your streak?" data, and the streak only tracks main challenges.
   */
  fetchHistory: (monthStart: Date, monthEnd: Date) => Promise<FetchHistoryResult>;
}

function todayDateString(): string {
  // Use the device-local date so "today" matches what the user sees on screen.
  // Server-side cron generates by user timezone; this read mirrors that intent.
  return formatLocalDate(new Date());
}

function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const VALID_FEEDBACK_VALUES: readonly ChallengeFeedback[] = [
  'easy',
  'great',
  'too_hard',
  'not_applicable',
];

export const useChallengeStore = create<ChallengeState>((set) => ({
  isPersisting: false,
  stats: null,
  history: null,
  historyLoading: false,

  fetchToday: async (): Promise<FetchTodayResult> => {
    const { data: userResp } = await supabase.auth.getUser();
    const user = userResp.user;
    if (!user) return { data: [], error: 'Not authenticated' };

    const today = todayDateString();

    // Pull today's challenges. Main first so callers can render in order.
    const { data: challenges, error } = await supabase
      .from('challenges')
      .select(
        'id, title, description, category, difficulty, duration_min, points, is_main, status, feedback',
      )
      .eq('user_id', user.id)
      .eq('date', today)
      .order('is_main', { ascending: false });

    if (error) return { data: [], error: error.message };

    const rows = (challenges ?? []) as TodayChallenge[];
    if (rows.length === 0) return { data: rows, error: null };

    // Atomic, once-per-day bump. Idempotency lives in the RPC's WHERE clause
    // (last_active IS NULL OR last_active < CURRENT_DATE), so concurrent calls
    // from multiple devices can't double-count.
    const { error: rpcErr } = await supabase.rpc('bump_challenges_seen', { n: rows.length });
    if (rpcErr) return { data: rows, error: rpcErr.message };

    return { data: rows, error: null };
  },

  markMainDone: async (content): Promise<PersistResult> => {
    set({ isPersisting: true });
    try {
      const { data: userResp } = await supabase.auth.getUser();
      const user = userResp.user;
      if (!user) return { error: 'Not authenticated' };

      const today = todayDateString();

      // Defensive backfill: pre-trigger users (registered before migration 005
      // was applied) lack a user_stats row, which would silently break the
      // streak trigger. ON CONFLICT preserves any existing row untouched.
      const { error: statsErr } = await supabase
        .from('user_stats')
        .upsert({ user_id: user.id }, { onConflict: 'user_id', ignoreDuplicates: true });
      if (statsErr) return { error: statsErr.message };

      // 1. Look up today's main challenge.
      const { data: existing, error: lookupErr } = await supabase
        .from('challenges')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('date', today)
        .eq('is_main', true)
        .maybeSingle<{ id: string; status: ChallengeStatus }>();
      if (lookupErr) return { error: lookupErr.message };

      let challengeId: string;

      if (existing) {
        challengeId = existing.id;
      } else {
        // 2. Not found — insert with status='pending' so the subsequent UPDATE
        //    triggers the AFTER UPDATE streak hook (insert+update is required;
        //    inserting directly as 'done' would not fire the trigger).
        const { data: inserted, error: insertErr } = await supabase
          .from('challenges')
          .insert({
            user_id: user.id,
            date: today,
            is_main: true,
            status: 'pending',
            ...content,
          })
          .select('id')
          .single<{ id: string }>();
        if (insertErr || !inserted) {
          return { error: insertErr?.message ?? 'Insert failed' };
        }
        challengeId = inserted.id;
      }

      // 3. Flip to done — this fires sync_user_stats_on_challenge_update.
      const { error: updateErr } = await supabase
        .from('challenges')
        .update({ status: 'done', completed_at: new Date().toISOString() })
        .eq('id', challengeId);
      if (updateErr) return { error: updateErr.message };

      return { error: null };
    } finally {
      set({ isPersisting: false });
    }
  },

  setMainFeedback: async (challengeId, feedback): Promise<PersistResult> => {
    if (!VALID_FEEDBACK_VALUES.includes(feedback)) {
      throw new Error(`Invalid feedback value: ${String(feedback)}`);
    }

    const { error } = await supabase
      .from('challenges')
      .update({ feedback })
      .eq('id', challengeId);

    return { error: error?.message ?? null };
  },

  fetchStats: async (): Promise<FetchStatsResult> => {
    const { data: userResp } = await supabase.auth.getUser();
    const user = userResp.user;
    if (!user) return { error: 'Not authenticated' };

    // Two reads in parallel:
    //   1. user_stats — streaks, points, totals, dates (trigger-maintained).
    //   2. get_my_completion_rates — live d7/d30 (sidesteps the stale-snapshot
    //      flaw of the trigger-maintained rate columns).
    // The RPC is the source of truth for the rates; the stored columns stay
    // populated as an advisory cache for the server-side AI generator.
    const [statsResult, ratesResult] = await Promise.all([
      supabase
        .from('user_stats')
        .select(
          'current_streak, longest_streak, total_points, d7_completion_rate, d30_completion_rate, total_challenges_done, total_challenges_seen',
        )
        .eq('user_id', user.id)
        .maybeSingle<UserStatsSnapshot>(),
      supabase.rpc('get_my_completion_rates'),
    ]);

    if (statsResult.error) return { error: statsResult.error.message };

    // maybeSingle returns null when the row is absent (legacy accounts pre-005);
    // collapse that into an all-zeros snapshot so callers don't need a null check.
    const base: UserStatsSnapshot = statsResult.data ?? ZERO_STATS;

    // RPC failure → keep the cached snapshot's rates and log. Don't fail the
    // whole call; streaks/points should still render.
    if (ratesResult.error) {
      console.warn('[get_my_completion_rates]', ratesResult.error.message);
      set({ stats: base });
      return { error: null };
    }

    // The RPC returns RETURNS TABLE (d7, d30); supabase-js surfaces that as
    // an array of one row. Defensive against an empty/odd payload.
    const row = Array.isArray(ratesResult.data) ? ratesResult.data[0] : ratesResult.data;
    const d7 = typeof row?.d7 === 'number' ? row.d7 : base.d7_completion_rate;
    const d30 = typeof row?.d30 === 'number' ? row.d30 : base.d30_completion_rate;

    set({
      stats: {
        ...base,
        d7_completion_rate: d7,
        d30_completion_rate: d30,
      },
    });
    return { error: null };
  },

  fetchHistory: async (monthStart, monthEnd): Promise<FetchHistoryResult> => {
    set({ historyLoading: true });
    try {
      const { data: userResp } = await supabase.auth.getUser();
      const user = userResp.user;
      if (!user) return { data: [], error: 'Not authenticated' };

      const startStr = formatLocalDate(monthStart);
      const endStr = formatLocalDate(monthEnd);

      const { data, error } = await supabase
        .from('challenges')
        .select('id, date, status, title, category')
        .eq('user_id', user.id)
        .eq('is_main', true)
        .gte('date', startStr)
        .lte('date', endStr)
        .order('date', { ascending: true });

      if (error) return { data: [], error: error.message };

      const rows = (data ?? []) as HistoryEntry[];
      set({ history: rows });
      return { data: rows, error: null };
    } finally {
      set({ historyLoading: false });
    }
  },
}));
