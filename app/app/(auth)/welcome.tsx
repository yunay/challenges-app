import { router } from 'expo-router';
import { type JSX } from 'react';

import WelcomeScreen from '@/components/screens/WelcomeScreen';

export default function WelcomeRoute(): JSX.Element {
  return (
    <WelcomeScreen
      theme="light"
      onGetStarted={(): void => router.push('/(auth)/register')}
      onSignIn={(): void => router.push('/(auth)/login')}
    />
  );
}
