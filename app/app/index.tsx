import { Redirect } from 'expo-router';
import { type JSX } from 'react';

import { useAuthStore } from '@/store/authStore';

export default function Index(): JSX.Element | null {
  const isLoading = useAuthStore((s) => s.isLoading);
  const session = useAuthStore((s) => s.session);
  const onboardingCompleted = useAuthStore((s) => s.onboardingCompleted);

  // Wait for the session bootstrap (AsyncStorage read + first auth event).
  if (isLoading) return null;

  if (!session) return <Redirect href="/(auth)/welcome" />;

  // Session present but onboarding status not yet fetched — keep the splash
  // up rather than guess wrong and bounce the user between routes.
  if (onboardingCompleted === null) return null;

  if (!onboardingCompleted) return <Redirect href="/(auth)/onboarding" />;

  return <Redirect href="/(tabs)" />;
}
