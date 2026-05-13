import { router } from 'expo-router';
import { useEffect, useMemo, type JSX } from 'react';
import { useTranslation } from 'react-i18next';

import BottomTabBar, { type BottomTabId } from '@/components/BottomTabBar';
import ProfileScreen, {
  type ProfileMetrics,
  type WeekDay,
  type WeekDayStatus,
} from '@/components/screens/ProfileScreen';
import { useAuthStore } from '@/store/authStore';
import {
  useChallengeStore,
  type UserStatsSnapshot,
  type WeekEntry,
} from '@/store/challengeStore';
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

function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Monday of the calendar week containing `from`, local time.
function startOfWeekMonday(from: Date): Date {
  const offset = (from.getDay() + 6) % 7;
  return new Date(from.getFullYear(), from.getMonth(), from.getDate() - offset);
}

// Builds the 7-day Mon→Sun skeleton for the current local week and merges
// in fetched rows. Days without a row land as status='none'. Today is
// computed once from `now` so all 7 entries see a consistent reference.
function buildWeekDays(
  entries: ReadonlyArray<WeekEntry> | null,
  locale: string,
  now: Date,
): WeekDay[] {
  const monday = startOfWeekMonday(now);
  const todayStr = formatLocalDate(now);
  const byDate = new Map<string, WeekEntry>();
  for (const e of entries ?? []) byDate.set(e.date, e);

  const days: WeekDay[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    const dateStr = formatLocalDate(d);
    const entry = byDate.get(dateStr);
    const status: WeekDayStatus = entry?.status ?? 'none';
    days.push({
      date: dateStr,
      weekday: weekdayLetter(d, locale),
      isToday: dateStr === todayStr,
      isPast: dateStr < todayStr,
      status,
    });
  }
  return days;
}

// 'narrow' gives single-letter weekdays in EN-GB ('M','T','W',…) and
// Cyrillic equivalents in BG-BG ('П','В','С',…). Some RN runtimes return
// the long form when 'narrow' isn't in the bundled CLDR — fall back to the
// first character of 'short' as a defensive layer.
function weekdayLetter(date: Date, locale: string): string {
  const narrow = date.toLocaleDateString(locale, { weekday: 'narrow' });
  if (narrow.length <= 2) return narrow;
  const short = date.toLocaleDateString(locale, { weekday: 'short' });
  return short.charAt(0).toUpperCase();
}

export default function ProfileRoute(): JSX.Element {
  const { i18n } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const stats = useChallengeStore((s) => s.stats);
  const fetchStats = useChallengeStore((s) => s.fetchStats);
  const week = useChallengeStore((s) => s.week);
  const fetchWeek = useChallengeStore((s) => s.fetchWeek);

  // Refresh on mount. Cheap (single-row SELECT) and ensures the user sees
  // up-to-date numbers after completing a challenge on Home.
  useEffect(() => {
    void fetchStats().then((res) => {
      if (res.error) console.warn('[fetchStats]', res.error);
    });
    void fetchWeek().then((res) => {
      if (res.error) console.warn('[fetchWeek]', res.error);
    });
  }, [fetchStats, fetchWeek]);

  const metrics = useMemo(() => toMetrics(stats), [stats]);
  const locale = i18n.language === 'bg' ? 'bg-BG' : 'en-GB';
  // Pass `undefined` until the first fetch lands — ProfileScreen falls back
  // to its placeholder skeleton so the layout doesn't jump.
  const weekDays = useMemo<WeekDay[] | undefined>(
    () => (week === null ? undefined : buildWeekDays(week, locale, new Date())),
    [week, locale],
  );
  const displayName = deriveDisplayName(user?.email, user?.user_metadata);

  return (
    <ProfileScreen
      theme="light"
      name={displayName}
      email={user?.email ?? undefined}
      metrics={metrics}
      week={weekDays}
      onSettings={(): void => router.push('/settings')}
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
