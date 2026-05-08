// Daily Challenges — Profile screen (React Native port of handoff/profile-screen.jsx).
// Avatar · 3 metrics · weekly chart (today-bar gradient + dashed) · settings list.
//
// Requires: react-native-svg (install via `npx expo install react-native-svg`).

import { cloneElement, type JSX, type ReactElement, type ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

// ---------------------------------------------------------------------------
// Theme tokens (mirror handoff exactly — Warm Amber on Stone neutrals)
// ---------------------------------------------------------------------------

const THEMES = {
  light: {
    bg: '#FAFAF7',
    surface: '#FFFFFF',
    surface2: '#F4F2EC',
    fg1: '#18221E',
    fg2: '#4A574F',
    fg3: '#7C8881',
    fg4: '#B0B8B3',
    border: '#ECEAE3',
    accent: '#D97706',
    accentBg: '#FEF6E7',
    accentBorder: '#FBD08A',
  },
  dark: {
    bg: '#15161A',
    surface: '#1E1F24',
    surface2: '#262830',
    fg1: '#F2EFE6',
    fg2: '#C2BFB4',
    fg3: '#8A8576',
    fg4: '#5A574E',
    border: '#2D2F37',
    accent: '#F5B14E',
    accentBg: 'rgba(245,177,78,0.12)',
    accentBorder: 'rgba(245,177,78,0.4)',
  },
} as const;

type ThemeName = keyof typeof THEMES;
type Theme = (typeof THEMES)[ThemeName];

const FONT_DISPLAY = 'PlusJakartaSans_700Bold';
const FONT_BODY = 'Inter_400Regular';
const FONT_BODY_MEDIUM = 'Inter_500Medium';
const FONT_BODY_SEMI = 'Inter_600SemiBold';

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

interface IconProps {
  size?: number;
  color?: string;
  sw?: number;
}

const SettingsIcon = ({ size = 18, color = 'currentColor', sw = 1.5 }: IconProps): JSX.Element => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx={12} cy={12} r={3} />
    <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </Svg>
);

const TargetIcon = ({ size = 18, color = 'currentColor', sw = 1.5 }: IconProps): JSX.Element => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx={12} cy={12} r={10} />
    <Circle cx={12} cy={12} r={6} />
    <Circle cx={12} cy={12} r={2} />
  </Svg>
);

const BellIcon = ({ size = 18, color = 'currentColor', sw = 1.5 }: IconProps): JSX.Element => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <Path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </Svg>
);

const GlobeIcon = ({ size = 18, color = 'currentColor', sw = 1.5 }: IconProps): JSX.Element => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx={12} cy={12} r={10} />
    <Path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" />
  </Svg>
);

const CrownIcon = ({ size = 18, color = 'currentColor', sw = 1.5 }: IconProps): JSX.Element => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M2 19h20M3 8l4 4 5-7 5 7 4-4-2 11H5z" />
  </Svg>
);

const ChevR = ({ size = 16, color = 'currentColor', sw = 1.5 }: IconProps): JSX.Element => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <Path d="m9 18 6-6-6-6" />
  </Svg>
);

// ---------------------------------------------------------------------------
// Metric card
// ---------------------------------------------------------------------------

interface MetricProps {
  value: string;
  suffix?: string;
  label: string;
  t: Theme;
}

const Metric = ({ value, suffix, label, t }: MetricProps): JSX.Element => (
  <View
    style={{
      flex: 1,
      paddingVertical: 14,
      paddingHorizontal: 12,
      backgroundColor: t.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: t.border,
    }}
  >
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
      <Text
        style={{
          fontFamily: FONT_DISPLAY,
          fontSize: 26,
          fontWeight: '700',
          color: t.fg1,
          fontVariant: ['tabular-nums'],
          letterSpacing: -0.65,
          lineHeight: 26,
        }}
      >
        {value}
      </Text>
      {suffix !== undefined && (
        <Text
          style={{
            fontSize: 13,
            color: t.fg3,
            fontWeight: '500',
            fontFamily: FONT_BODY_MEDIUM,
          }}
        >
          {suffix}
        </Text>
      )}
    </View>
    <Text
      style={{
        fontSize: 11,
        color: t.fg3,
        fontWeight: '600',
        marginTop: 8,
        letterSpacing: 0.66,
        textTransform: 'uppercase',
        fontFamily: FONT_BODY_SEMI,
      }}
    >
      {label}
    </Text>
  </View>
);

// ---------------------------------------------------------------------------
// Weekly chart
// ---------------------------------------------------------------------------

export interface WeeklyDay {
  label: string;
  value: number;
  today: boolean;
}

interface WeeklyChartProps {
  t: Theme;
  data: WeeklyDay[];
  doneCount?: number;
}

const CHART_AREA_HEIGHT = 96;
const CHART_BAR_MAX_HEIGHT = 84; // matches source; 12px headroom under the 96 area

const WeeklyChart = ({ t, data, doneCount }: WeeklyChartProps): JSX.Element => {
  const max = Math.max(...data.map((d) => d.value), 1);
  const total = data.length;
  const done = doneCount ?? data.filter((d) => d.value > 0).length;

  return (
    <View
      style={{
        backgroundColor: t.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: t.border,
        paddingTop: 16,
        paddingHorizontal: 16,
        paddingBottom: 12,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 14,
        }}
      >
        <Text
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 14,
            fontWeight: '700',
            color: t.fg1,
            letterSpacing: -0.14,
          }}
        >
          This week
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: t.fg3,
            fontWeight: '500',
            fontVariant: ['tabular-nums'],
            fontFamily: FONT_BODY_MEDIUM,
          }}
        >
          {done} of {total} done
        </Text>
      </View>

      {/* Bars row */}
      <View
        style={{
          flexDirection: 'row',
          gap: 8,
          height: CHART_AREA_HEIGHT,
          alignItems: 'flex-end',
          marginBottom: 8,
        }}
      >
        {data.map((d, i) => {
          const muted = d.value === 0;
          const h = muted ? 4 : Math.max(Math.round((d.value / max) * CHART_BAR_MAX_HEIGHT), 8);
          return (
            <View key={`${d.label}-${i}`} style={{ flex: 1, height: '100%', justifyContent: 'flex-end' }}>
              <ChartBar height={h} muted={muted} today={d.today} t={t} />
            </View>
          );
        })}
      </View>

      {/* Day labels */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {data.map((d, i) => (
          <Text
            key={`${d.label}-label-${i}`}
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: 11,
              fontWeight: '500',
              color: d.today ? t.accent : t.fg3,
              fontFamily: FONT_BODY_MEDIUM,
            }}
          >
            {d.label}
          </Text>
        ))}
      </View>
    </View>
  );
};

interface ChartBarProps {
  height: number;
  muted: boolean;
  today: boolean;
  t: Theme;
}

const ChartBar = ({ height, muted, today, t }: ChartBarProps): JSX.Element => {
  // Empty days: thin neutral stub. Other days: solid amber. Today: amber gradient
  // fading toward accentBg over the bottom 40%, with a 1px dashed accent border
  // and 0.85 opacity — the "in-progress" feel.
  if (muted) {
    return (
      <View
        style={{
          width: '100%',
          height,
          borderRadius: 4,
          backgroundColor: t.border,
        }}
      />
    );
  }
  if (!today) {
    return (
      <View
        style={{
          width: '100%',
          height,
          borderRadius: 4,
          backgroundColor: t.accent,
        }}
      />
    );
  }
  return (
    <View
      style={{
        width: '100%',
        height,
        borderRadius: 4,
        opacity: 0.85,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: t.accent,
        overflow: 'hidden',
      }}
    >
      {/* SVG fills the box; preserveAspectRatio="none" stretches the gradient
          to whatever pixel size flex hands the bar. */}
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="profile-bar-gradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={t.accent} stopOpacity={1} />
            <Stop offset="0.6" stopColor={t.accent} stopOpacity={1} />
            <Stop offset="1" stopColor={t.accentBg} stopOpacity={1} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={100} height={100} fill="url(#profile-bar-gradient)" />
      </Svg>
    </View>
  );
};

// ---------------------------------------------------------------------------
// Settings list row + section label
// ---------------------------------------------------------------------------

interface SettingsRowProps {
  icon: ReactElement<IconProps>;
  label: string;
  value: string;
  valueColor?: string;
  last?: boolean;
  accent?: boolean;
  t: Theme;
  onPress?: () => void;
}

const SettingsRow = ({
  icon,
  label,
  value,
  valueColor,
  last = false,
  accent = false,
  t,
  onPress,
}: SettingsRowProps): JSX.Element => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={`${label}, ${value}`}
    onPress={onPress}
    style={({ pressed }): ViewStyle => ({
      width: '100%',
      paddingVertical: 16,
      paddingHorizontal: 4,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      borderBottomWidth: last ? 0 : 1,
      borderBottomColor: t.border,
      opacity: pressed ? 0.7 : 1,
    })}
  >
    <View
      style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: accent ? t.accentBg : t.surface2,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {cloneElement(icon, { color: accent ? t.accent : t.fg2, size: 17 })}
    </View>
    <Text
      style={{
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
        color: t.fg1,
        fontFamily: FONT_BODY_MEDIUM,
      }}
    >
      {label}
    </Text>
    <Text
      style={{
        fontSize: 13,
        color: valueColor ?? t.fg3,
        fontWeight: '500',
        fontFamily: FONT_BODY_MEDIUM,
      }}
    >
      {value}
    </Text>
    <ChevR color={t.fg4} size={16} />
  </Pressable>
);

interface SectionLabelProps {
  children: string;
  t: Theme;
}

const SectionLabel = ({ children, t }: SectionLabelProps): JSX.Element => (
  <Text
    style={{
      fontSize: 11,
      color: t.fg3,
      fontWeight: '600',
      letterSpacing: 0.88,
      textTransform: 'uppercase',
      marginTop: 24,
      marginBottom: 12,
      fontFamily: FONT_BODY_SEMI,
    }}
  >
    {children}
  </Text>
);

// ---------------------------------------------------------------------------
// ProfileScreen
// ---------------------------------------------------------------------------

export interface ProfileMetrics {
  streak: number;
  points: number;
  completion: number;
}

const DEFAULT_METRICS: ProfileMetrics = {
  streak: 14,
  points: 1240,
  completion: 86,
};

const DEFAULT_WEEK: WeeklyDay[] = [
  { label: 'M', value: 18, today: false },
  { label: 'T', value: 25, today: false },
  { label: 'W', value: 15, today: false },
  { label: 'T', value: 25, today: false },
  { label: 'F', value: 0, today: false },
  { label: 'S', value: 30, today: false },
  { label: 'S', value: 15, today: true },
];

export interface ProfileScreenProps {
  theme: ThemeName;
  name: string;
  memberSince?: string;
  metrics?: ProfileMetrics;
  week?: WeeklyDay[];
  preferences?: {
    goalsCount?: number;
    notificationTime?: string;
    language?: string;
  };
  subscriptionLabel?: string;
  onSettings?: () => void;
  onGoals?: () => void;
  onNotificationTime?: () => void;
  onLanguage?: () => void;
  onSubscription?: () => void;
  /** Optional bottom slot to layer a tab bar on top of the screen. */
  footer?: ReactNode;
}

function computeInitials(name: string): string {
  return (
    name
      .split(' ')
      .map((n) => n[0])
      .filter((c): c is string => typeof c === 'string' && c.length > 0)
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'A'
  );
}

function formatNumber(n: number): string {
  // Match the source's "1,240" rendering (thousands grouped) regardless of locale.
  return n.toLocaleString('en-US');
}

export default function ProfileScreen({
  theme,
  name,
  memberSince = 'Member since Apr 2025',
  metrics = DEFAULT_METRICS,
  week = DEFAULT_WEEK,
  preferences,
  subscriptionLabel = 'Free · Upgrade',
  onSettings,
  onGoals,
  onNotificationTime,
  onLanguage,
  onSubscription,
  footer,
}: ProfileScreenProps): JSX.Element {
  const t: Theme = theme === 'dark' ? THEMES.dark : THEMES.light;
  const initials = computeInitials(name);

  const goalsValue = preferences?.goalsCount !== undefined ? `${preferences.goalsCount} selected` : '3 selected';
  const notifValue = preferences?.notificationTime ?? '8:00 AM';
  const langValue = preferences?.language ?? 'English';

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 60, paddingHorizontal: 20, paddingBottom: 180 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <Text
            accessibilityRole="header"
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 22,
              fontWeight: '700',
              color: t.fg1,
              letterSpacing: -0.55,
            }}
          >
            Profile
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Settings"
            onPress={onSettings}
            hitSlop={8}
            style={{ padding: 6 }}
          >
            <SettingsIcon color={t.fg2} size={20} />
          </Pressable>
        </View>

        {/* Avatar block */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 22 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 9999,
              backgroundColor: t.accentBg,
              borderWidth: 1,
              borderColor: t.accentBorder,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: 22,
                fontWeight: '700',
                color: t.accent,
                letterSpacing: -0.22,
              }}
            >
              {initials}
            </Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: 20,
                fontWeight: '700',
                color: t.fg1,
                letterSpacing: -0.4,
                lineHeight: 24,
              }}
            >
              {name}
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: t.fg3,
                marginTop: 2,
                fontWeight: '500',
                fontFamily: FONT_BODY_MEDIUM,
              }}
            >
              {memberSince}
            </Text>
          </View>
        </View>

        {/* Metric row */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          <Metric value={String(metrics.streak)} suffix="days" label="Streak" t={t} />
          <Metric value={formatNumber(metrics.points)} label="Points" t={t} />
          <Metric value={String(metrics.completion)} suffix="%" label="Completion" t={t} />
        </View>

        {/* Weekly chart */}
        <WeeklyChart t={t} data={week} />

        {/* Preferences section */}
        <SectionLabel t={t}>Preferences</SectionLabel>
        <View>
          <SettingsRow icon={<TargetIcon />} label="Goals" value={goalsValue} t={t} onPress={onGoals} />
          <SettingsRow icon={<BellIcon />} label="Notification time" value={notifValue} t={t} onPress={onNotificationTime} />
          <SettingsRow icon={<GlobeIcon />} label="Language" value={langValue} last t={t} onPress={onLanguage} />
        </View>

        {/* Plan section */}
        <SectionLabel t={t}>Plan</SectionLabel>
        <View>
          <SettingsRow
            icon={<CrownIcon />}
            label="Subscription"
            value={subscriptionLabel}
            valueColor={t.accent}
            accent
            last
            t={t}
            onPress={onSubscription}
          />
        </View>
      </ScrollView>

      {footer}
    </View>
  );
}
