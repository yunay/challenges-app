import { router } from 'expo-router';
import { useState, type JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import AuthScreen from '@/components/screens/AuthScreen';
import { useAuthStore } from '@/store/authStore';

export default function RegisterRoute(): JSX.Element {
  const { t } = useTranslation();
  const signUp = useAuthStore((s) => s.signUp);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (data: {
    name: string;
    email: string;
    password: string;
  }): Promise<void> => {
    if (submitting) return;
    setSubmitting(true);
    const { error } = await signUp(data.email, data.password, data.name);
    setSubmitting(false);

    if (error) {
      Alert.alert(t('auth.errors.sign_up_failed_title'), error);
      return;
    }

    // If email confirmation is enabled, no session was returned and the user
    // must verify before signing in. Surface that and stay on this screen.
    if (!useAuthStore.getState().session) {
      Alert.alert(t('auth.confirm_email_title'), t('auth.confirm_email_body'));
      router.replace('/(auth)/login');
      return;
    }

    router.replace('/(auth)/onboarding');
  };

  return (
    <AuthScreen
      mode="register"
      theme="light"
      onBack={(): void => router.back()}
      onSwitchMode={(): void => router.replace('/(auth)/login')}
      onRegisterSubmit={(data): void => {
        void handleSubmit(data);
      }}
    />
  );
}
