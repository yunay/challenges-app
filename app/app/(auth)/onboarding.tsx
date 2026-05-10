import { router } from 'expo-router';
import { useState, type JSX } from 'react';
import { useTranslation } from 'react-i18next';

import SurveyScreen, { type SurveyOptionId } from '@/components/screens/SurveyScreen';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store/authStore';
import { useChallengeStore } from '@/store/challengeStore';

const SEED_TIMEOUT_MS = 3000;

// Survey IDs differ from the values the DB expects (and from what the AI
// generator + bonus categorisation use). Map at the seam so the rest of the
// app sees the canonical names.
function mapGoalToDbValue(id: SurveyOptionId): string {
  switch (id) {
    case 'physical':
      return 'health';
    case 'finances':
      return 'finance';
    case 'growth':
      return 'personal_growth';
    case 'mental':
    case 'productivity':
    case 'social':
      return id;
  }
}

export default function OnboardingRoute(): JSX.Element {
  const { t, i18n } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const refreshOnboardingStatus = useAuthStore((s) => s.refreshOnboardingStatus);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  const handleContinue = async (selected: readonly SurveyOptionId[]): Promise<void> => {
    if (!user || submitting) return;

    if (selected.length === 0) {
      setErrorMessage(t('onboarding.errors.goals_required'));
      return;
    }

    setErrorMessage(undefined);
    setSubmitting(true);

    const language: 'en' | 'bg' = i18n.language === 'bg' ? 'bg' : 'en';
    const timezone =
      Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'Europe/London';
    const goals = selected.map(mapGoalToDbValue);

    // Two-step write: persist the answers FIRST, then flip onboarding_completed.
    // The flag gates the boot router redirect, so we never want it set without
    // the underlying fields populated.
    const { error: profileErr } = await supabase
      .from('user_profiles')
      .update({
        goals,
        daily_time_minutes: 30,
        preferred_time: 'morning',
        language,
        timezone,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (profileErr) {
      setErrorMessage(t('onboarding.errors.save_failed'));
      setSubmitting(false);
      return;
    }

    const { error: flagErr } = await supabase
      .from('user_profiles')
      .update({
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (flagErr) {
      setErrorMessage(t('onboarding.errors.save_failed'));
      setSubmitting(false);
      return;
    }

    await refreshOnboardingStatus();

    // Seed today's challenges from challenge_bank (migration 007). Best-effort:
    // if the RPC errors or runs past the 3s budget, the empty state on Home
    // covers the gap until the 02:00 cron picks the user up tomorrow.
    const seedRpc = supabase.rpc('seed_first_day_challenges');
    const seedTimeout = new Promise<'timeout'>((resolve) =>
      setTimeout(() => resolve('timeout'), SEED_TIMEOUT_MS),
    );
    const seedResult = await Promise.race([seedRpc, seedTimeout]);
    if (seedResult === 'timeout') {
      console.warn('[seed_first_day_challenges] timed out');
    } else if (seedResult.error) {
      console.warn('[seed_first_day_challenges]', seedResult.error.message);
    }

    // Warm the store so HomeScreen's mount-time fetch sees the seeded rows
    // (and the bump_challenges_seen RPC fires once, idempotently).
    await useChallengeStore.getState().fetchToday();

    router.replace('/(tabs)');
  };

  return (
    <SurveyScreen
      theme="light"
      submitting={submitting}
      errorMessage={errorMessage}
      onContinue={(selected): void => {
        void handleContinue(selected);
      }}
    />
  );
}
