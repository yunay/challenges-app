import { router } from 'expo-router';
import { useEffect, useMemo, type JSX } from 'react';
import { useTranslation } from 'react-i18next';

import BottomTabBar, { type BottomTabId } from '@/components/BottomTabBar';
import ProfileScreen, { type ProfileMetrics } from '@/components/screens/ProfileScreen';
import { useAuthStore } from '@/store/authStore';
import { useChallengeStore, type UserStatsSnapshot } from '@/store/challengeStore';
import { deriveDisplayName } from '@/utils/displayName';

const TAB_ROUTES: Record<BottomTabId, '/(tabs)' | '/(tabs)/history' | '/(tabs)/profile'> = {
  home: '/(tabs)',
  history: '/(tabs)/history',
  profile: '/(tabs)/profile',
};

// Headline metrics shown on the profile cards. The screen displays one
// completion metric — d30 reads as a more representative "how am I doing
// in general" signal than d7, which is already implied by the weekly chart.
function toMetrics(stats: UserStatsSnapshot | null): ProfileMetrics {
  if (!stats) {
    return { streak: '—', points: '—', completion: '—' };
  }
  return {
    streak: String(stats.current_streak),
    // Thousands grouping. Locale-fixed to en-US so the format is stable across
    // device locales — the design tracks the original "1,240" rendering.
    points: stats.total_points.toLocaleString('en-US'),
    completion: String(Math.round(stats.d30_completion_rate * 100)),
  };
}

// Display-only — there's no language picker in this task. Language switches
// happen via app settings; this label just reflects the active i18n locale.
function languageLabel(lang: string): string {
  return lang === 'bg' ? 'Български' : 'English';
}

export default function ProfileRoute(): JSX.Element {
  const { i18n } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const stats = useChallengeStore((s) => s.stats);
  const fetchStats = useChallengeStore((s) => s.fetchStats);

  // Refresh on mount. Cheap (single-row SELECT) and ensures the user sees
  // up-to-date numbers after completing a challenge on Home.
  useEffect(() => {
    void fetchStats().then((res) => {
      if (res.error) console.warn('[fetchStats]', res.error);
    });
  }, [fetchStats]);

  const metrics = useMemo(() => toMetrics(stats), [stats]);
  const displayName = deriveDisplayName(user?.email, user?.user_metadata);

  return (
    <ProfileScreen
      theme="light"
      name={displayName}
      email={user?.email ?? undefined}
      metrics={metrics}
      preferences={{ language: languageLabel(i18n.language) }}
      footer={
        <BottomTabBar
          theme="light"
          active="profile"
          onTab={(id): void => {
            if (id !== 'profile') router.replace(TAB_ROUTES[id]);
          }}
        />
      }
    />
  );
}
