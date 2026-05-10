import { Redirect, Tabs } from 'expo-router';
import { type JSX } from 'react';

import { useAuthStore } from '@/store/authStore';

// The visual tab bar lives inside each screen (HomeScreen paints its own bar;
// History/Profile receive the same bar via their `footer` prop). We use Tabs
// here purely for the route group, so the default Expo Router bar is hidden.
export default function TabsLayout(): JSX.Element | null {
  const isLoading = useAuthStore((s) => s.isLoading);
  const session = useAuthStore((s) => s.session);

  // Wait for the session bootstrap so we don't bounce a returning user out
  // to /welcome before AsyncStorage has been read.
  if (isLoading) return null;
  if (!session) return <Redirect href="/(auth)/welcome" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="history" options={{ title: 'History' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
