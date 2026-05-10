// Shared bottom tab bar — visually identical to the bar already painted by
// HomeScreen. Used as the `footer` slot on HistoryScreen and ProfileScreen so
// every (tabs) route renders the same bar without duplicating its markup.

import { type JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle, Path, Polyline, Rect } from 'react-native-svg';

const THEMES = {
  light: {
    fg3: '#7C8881',
    border: '#ECEAE3',
    accent: '#D97706',
    tabBg: 'rgba(255,255,255,0.92)',
  },
  dark: {
    fg3: '#8A8576',
    border: '#2D2F37',
    accent: '#F5B14E',
    tabBg: 'rgba(30,31,36,0.92)',
  },
} as const;

type ThemeName = keyof typeof THEMES;
type Theme = (typeof THEMES)[ThemeName];

const FONT_BODY_MEDIUM = 'Inter_500Medium';
const FONT_BODY_SEMI = 'Inter_600SemiBold';

interface IconProps {
  size?: number;
  color?: string;
  sw?: number;
}

const HomeIcon = ({ size = 22, color = 'currentColor', sw = 1.5 }: IconProps): JSX.Element => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <Path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <Polyline points="9 22 9 12 15 12 15 22" />
  </Svg>
);

const CalIcon = ({ size = 22, color = 'currentColor', sw = 1.5 }: IconProps): JSX.Element => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <Rect width={18} height={18} x={3} y={4} rx={2} />
    <Path d="M16 2v4M8 2v4M3 10h18" />
  </Svg>
);

const UserIcon = ({ size = 22, color = 'currentColor', sw = 1.5 }: IconProps): JSX.Element => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx={12} cy={8} r={5} />
    <Path d="M20 21a8 8 0 1 0-16 0" />
  </Svg>
);

export type BottomTabId = 'home' | 'history' | 'profile';

export interface BottomTabBarProps {
  active: BottomTabId;
  theme: ThemeName;
  onTab?: (id: BottomTabId) => void;
}

export default function BottomTabBar({ active, theme, onTab }: BottomTabBarProps): JSX.Element {
  const t: Theme = theme === 'dark' ? THEMES.dark : THEMES.light;
  const { t: translate } = useTranslation();

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: t.tabBg,
        borderTopWidth: 1,
        borderTopColor: t.border,
        paddingBottom: 24,
      }}
    >
      <View style={{ flexDirection: 'row', height: 60 }}>
        {(
          [
            { id: 'home', labelKey: 'nav.home', Icon: HomeIcon },
            { id: 'history', labelKey: 'nav.history', Icon: CalIcon },
            { id: 'profile', labelKey: 'nav.profile', Icon: UserIcon },
          ] as const
        ).map((tab) => {
          const sel = tab.id === active;
          return (
            <Pressable
              key={tab.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: sel }}
              onPress={(): void => onTab?.(tab.id)}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
              }}
            >
              <tab.Icon size={22} color={sel ? t.accent : t.fg3} sw={sel ? 2 : 1.5} />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: sel ? '600' : '500',
                  color: sel ? t.accent : t.fg3,
                  fontFamily: sel ? FONT_BODY_SEMI : FONT_BODY_MEDIUM,
                }}
              >
                {translate(tab.labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
