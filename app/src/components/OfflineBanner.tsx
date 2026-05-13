// Global offline banner. Mounted once at the root, sits above all routes
// and pushes the rest of the layout down by its own height when visible.
//
// Visibility rule:
//   `state.isConnected === false`
//   AND
//   `state.isInternetReachable !== null` — distinguishes "device says no
//   network" from "we haven't determined yet" (the initial NetInfo state).
//   Showing the banner on the unknown state would flash a false-positive
//   warning on cold start.

import { useEffect, useRef, useState, type JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetInfo } from '@react-native-community/netinfo';

const BANNER_HEIGHT = 28;
const COLORS = {
  bg: '#4A574F',
  fg: '#FAFAF7',
} as const;

const FONT_BODY_MEDIUM = 'Inter_500Medium';

const WifiOffIcon = (): JSX.Element => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={COLORS.fg} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Line x1={1} y1={1} x2={23} y2={23} />
    <Path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
    <Path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
    <Path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
    <Path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
    <Path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
    <Line x1={12} y1={20} x2={12.01} y2={20} />
  </Svg>
);

export default function OfflineBanner(): JSX.Element | null {
  const { t } = useTranslation();
  const netInfo = useNetInfo();
  const insets = useSafeAreaInsets();

  // `offline` is the rule above. We keep a separate `visible` state because
  // the slide-out animation needs the banner to stay mounted until the
  // animation finishes — unmounting immediately would cut the transition.
  const offline =
    netInfo.isConnected === false && netInfo.isInternetReachable !== null;

  const [visible, setVisible] = useState(offline);
  const translateY = useRef(new Animated.Value(offline ? 0 : -1)).current;

  useEffect(() => {
    if (offline) {
      setVisible(true);
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else if (visible) {
      Animated.timing(translateY, {
        toValue: -1,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setVisible(false);
      });
    }
  }, [offline, translateY, visible]);

  if (!visible) return null;

  const totalHeight = BANNER_HEIGHT + insets.top;

  // Interpolate translateY from -1 (fully hidden above the screen) to 0
  // (resting position). Using the total height keeps the animation in sync
  // with the safe-area inset on notched devices.
  const offsetY = translateY.interpolate({
    inputRange: [-1, 0],
    outputRange: [-totalHeight, 0],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          height: totalHeight,
          transform: [{ translateY: offsetY }],
        },
      ]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <View style={styles.row}>
        <WifiOffIcon />
        <Text style={styles.text}>{t('offline.banner')}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.bg,
    width: '100%',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: BANNER_HEIGHT,
  },
  text: {
    color: COLORS.fg,
    fontFamily: FONT_BODY_MEDIUM,
    fontSize: 13,
    fontWeight: '500',
  },
});
