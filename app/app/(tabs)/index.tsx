import { router } from 'expo-router';
import { useEffect, useState, type JSX } from 'react';

import HomeScreen, { type HomeChallenge, type TabId } from '@/components/screens/HomeScreen';
import { useAuthStore } from '@/store/authStore';
import {
  useChallengeStore,
  type ChallengeContent,
  type TodayChallenge,
} from '@/store/challengeStore';
import { deriveDisplayName } from '@/utils/displayName';

const TAB_ROUTES: Record<TabId, '/(tabs)' | '/(tabs)/history' | '/(tabs)/profile'> = {
  home: '/(tabs)',
  history: '/(tabs)/history',
  profile: '/(tabs)/profile',
};

function toHomeChallenge(c: TodayChallenge): HomeChallenge {
  return {
    id: c.id,
    title: c.title,
    description: c.description,
    category: c.category,
    difficulty: c.difficulty,
    duration_min: c.duration_min,
    points: c.points,
    status: c.status,
    feedback: c.feedback,
  };
}

export default function HomeRoute(): JSX.Element {
  const fetchToday = useChallengeStore((s) => s.fetchToday);
  const markMainDone = useChallengeStore((s) => s.markMainDone);
  const setMainFeedback = useChallengeStore((s) => s.setMainFeedback);
  const fetchStats = useChallengeStore((s) => s.fetchStats);
  const stats = useChallengeStore((s) => s.stats);

  const user = useAuthStore((s) => s.user);

  const [challenges, setChallenges] = useState<TodayChallenge[]>([]);

  // Load today's rows + stats in parallel on mount. fetchToday also bumps
  // total_challenges_seen the first time the user opens the home tab today
  // (idempotent inside the store).
  useEffect(() => {
    void fetchToday().then((res) => {
      if (res.error) console.warn('[fetchToday]', res.error);
      setChallenges(res.data);
    });
    void fetchStats().then((res) => {
      if (res.error) console.warn('[fetchStats]', res.error);
    });
  }, [fetchToday, fetchStats]);

  const main = challenges.find((c) => c.is_main);
  const bonuses = challenges.filter((c) => !c.is_main);

  const mainChallenge: HomeChallenge | null = main ? toHomeChallenge(main) : null;
  const bonusChallenges: HomeChallenge[] = bonuses.map(toHomeChallenge);

  const displayName = deriveDisplayName(user?.email, user?.user_metadata);
  const streak = stats?.current_streak ?? 0;

  return (
    <HomeScreen
      theme="light"
      name={displayName}
      streak={streak}
      active="home"
      mainChallenge={mainChallenge}
      bonusChallenges={bonusChallenges}
      onTab={(id): void => {
        if (id !== 'home') router.replace(TAB_ROUTES[id]);
      }}
      onMarkDone={(): void => {
        if (!mainChallenge) return;
        const content: ChallengeContent = {
          title: mainChallenge.title,
          description: mainChallenge.description,
          category: mainChallenge.category,
          difficulty: mainChallenge.difficulty,
          duration_min: mainChallenge.duration_min,
          points: mainChallenge.points,
        };
        // Optimistic flow: HomeScreen flips its local state immediately. After
        // the DB write resolves, refetch challenges (so status='done' lands in
        // mainChallenge — the card stays completed across reload) and stats
        // (the trigger updated current_streak server-side).
        void markMainDone(content).then((res) => {
          if (res.error) {
            console.warn('[markMainDone]', res.error);
            return;
          }
          void fetchToday().then((toRes) => {
            if (toRes.error) console.warn('[fetchToday]', toRes.error);
            else setChallenges(toRes.data);
          });
          void fetchStats().then((stRes) => {
            if (stRes.error) console.warn('[fetchStats]', stRes.error);
          });
        });
      }}
      onFeedback={async (id): Promise<{ error: string | null }> => {
        if (!main) return { error: 'No active challenge' };
        const res = await setMainFeedback(main.id, id);
        if (res.error) console.warn('[setMainFeedback]', res.error);
        return res;
      }}
    />
  );
}
