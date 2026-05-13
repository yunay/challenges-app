import { Redirect } from 'expo-router';
import { useEffect, type JSX } from 'react';

import { DELETION_GRACE_DAYS, useAuthStore } from '@/store/authStore';

export default function Index(): JSX.Element | null {
  const isLoading = useAuthStore((s) => s.isLoading);
  const session = useAuthStore((s) => s.session);
  const onboardingCompleted = useAuthStore((s) => s.onboardingCompleted);
  const deletedAt = useAuthStore((s) => s.deletedAt);
  const signOut = useAuthStore((s) => s.signOut);

  // Past-grace defensive sign-out. Strictly this shouldn't be reachable —
  // purge_deleted_accounts removes the auth.users row, which invalidates
  // the session — but if the cron is paused and someone re-logs in just
  // past the grace cutoff, fall back to welcome rather than a stuck screen.
  useEffect(() => {
    if (typeof deletedAt !== 'string') return;
    const deletedDate = new Date(deletedAt);
    const graceEnd = new Date(deletedDate);
    graceEnd.setDate(graceEnd.getDate() + DELETION_GRACE_DAYS);
    if (graceEnd.getTime() < Date.now()) {
      void signOut();
    }
  }, [deletedAt, signOut]);

  // Wait for the session bootstrap (AsyncStorage read + first auth event).
  if (isLoading) return null;

  if (!session) return <Redirect href="/(auth)/welcome" />;

  // Session present but the profile fetch is still in flight. Keep the
  // splash up rather than guess wrong and bounce the user between routes.
  if (onboardingCompleted === null || deletedAt === 'unknown') return null;

  // Soft-deleted within grace → restore screen instead of normal flow.
  // Past-grace is handled by the effect above (sign-out), which will
  // re-render with no session on the next pass.
  if (typeof deletedAt === 'string') {
    const deletedDate = new Date(deletedAt);
    const graceEnd = new Date(deletedDate);
    graceEnd.setDate(graceEnd.getDate() + DELETION_GRACE_DAYS);
    if (graceEnd.getTime() >= Date.now()) {
      return <Redirect href="/(auth)/restore" />;
    }
    // Past-grace: keep the splash up until the effect signs out and the
    // next render resolves to the welcome redirect.
    return null;
  }

  if (!onboardingCompleted) return <Redirect href="/(auth)/onboarding" />;

  return <Redirect href="/(tabs)" />;
}
