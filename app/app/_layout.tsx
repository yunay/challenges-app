import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState, type JSX } from 'react';

import '../global.css';
import '@/i18n';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store/authStore';

export default function RootLayout(): JSX.Element {
  const [queryClient] = useState(() => new QueryClient());
  const setSession = useAuthStore((s) => s.setSession);

  useEffect(() => {
    // Bootstrap: read the persisted session (AsyncStorage) so we don't flash
    // the welcome screen for an already-signed-in user on cold start.
    void supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Subscribe to all subsequent auth changes (sign-in, sign-out, token refresh).
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return (): void => {
      subscription.unsubscribe();
    };
  }, [setSession]);

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </QueryClientProvider>
  );
}
