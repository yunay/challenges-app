import { router } from 'expo-router';
import { useState, type JSX } from 'react';
import { Alert } from 'react-native';

import AuthScreen from '@/components/screens/AuthScreen';
import { useAuthStore } from '@/store/authStore';

export default function LoginRoute(): JSX.Element {
  const signIn = useAuthStore((s) => s.signIn);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (email: string, password: string): Promise<void> => {
    if (submitting) return;
    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);

    if (error) {
      Alert.alert('Sign in failed', error);
      return;
    }

    // signIn awaits refreshOnboardingStatus, so the store value is current here.
    const onboarded = useAuthStore.getState().onboardingCompleted ?? false;
    router.replace(onboarded ? '/(tabs)' : '/(auth)/onboarding');
  };

  return (
    <AuthScreen
      mode="login"
      theme="light"
      onBack={(): void => router.back()}
      onSwitchMode={(): void => router.replace('/(auth)/register')}
      onLoginSubmit={(email, password): void => {
        void handleSubmit(email, password);
      }}
    />
  );
}
