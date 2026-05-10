import { router } from 'expo-router';
import { type JSX } from 'react';

import BottomTabBar, { type BottomTabId } from '@/components/BottomTabBar';
import HistoryScreen from '@/components/screens/HistoryScreen';

const TAB_ROUTES: Record<BottomTabId, '/(tabs)' | '/(tabs)/history' | '/(tabs)/profile'> = {
  home: '/(tabs)',
  history: '/(tabs)/history',
  profile: '/(tabs)/profile',
};

export default function HistoryRoute(): JSX.Element {
  return (
    <HistoryScreen
      theme="light"
      footer={
        <BottomTabBar
          theme="light"
          active="history"
          onTab={(id): void => {
            if (id !== 'history') router.replace(TAB_ROUTES[id]);
          }}
        />
      }
    />
  );
}
