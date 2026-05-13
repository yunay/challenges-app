// Sentry init at module top — runs BEFORE any React component mounts, so
// errors thrown during the first render are captured. Idempotent (guarded
// against HMR / re-imports inside the service).
import { initSentry } from '@/services/sentry';
initSentry();

import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState, type JSX } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '../global.css';
import '@/i18n';
import ErrorBoundary from '@/components/ErrorBoundary';
import OfflineBanner from '@/components/OfflineBanner';
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

  // Layout order: SafeAreaProvider (required by OfflineBanner's inset)
  //   → ErrorBoundary (catches render errors anywhere below)
  //   → QueryClient (must be inside the boundary so React Query errors
  //     surface in the boundary's fallback too)
  //   → View containing the Stack with OfflineBanner absolutely-positioned
  //     on top. The banner pushes nothing else around — it slides over the
  //     status-bar area when offline and disappears otherwise.
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <View style={styles.root}>
            {/* Banner first — takes its own layout space at the top when
                offline, shifting the Stack down. Returns null when online,
                reclaiming the space. Per spec: no overlay. */}
            <OfflineBanner />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="settings" />
            </Stack>
          </View>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
