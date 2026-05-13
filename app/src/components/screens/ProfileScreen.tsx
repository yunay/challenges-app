// Daily Challenges — Profile screen (React Native port of handoff/profile-screen.jsx).
// Avatar · 3 metrics · weekly chart. Preferences + Plan rows moved to /settings;
// the cog in the header is the entry point.
//
// Requires: react-native-svg (install via `npx expo install react-native-svg`).

import { type JSX, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Pressable,
  ScrollView,
  Text,
  View,
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
    onAccent: '#FFFFFF',
    overlay: 'rgba(15,30,25,0.45)',
    error: '#B5523F',
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
    onAccent: '#15161A',
    overlay: 'rgba(0,0,0,0.55)',
    error: '#FC8181',
  },
} as const;

type ThemeName = keyof typeof THEMES;
type Theme = (typeof THEMES)[ThemeName];

const FONT_DISPLAY = 'PlusJakartaSans_700Bold';
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

export type WeekDayStatus = 'done' | 'skipped' | 'pending' | 'none';

export interface WeekDay {
  /** 'YYYY-MM-DD', user-local. */
  date: string;
  /** Locale-aware single-letter weekday label (M/T/W/T/F/S/S in EN-GB). */
  weekday: string;
  isToday: boolean;
  /** Strictly before today in the user's local timezone. */
  isPast: boolean;
  /** 'none' means no challenge row exists for that date. */
  status: WeekDayStatus;
}

interface WeeklyChartProps {
  t: Theme;
  data: WeekDay[];
}

const CHART_AREA_HEIGHT = 96;
const CHART_BAR_MAX_HEIGHT = 84; // matches source; 12px headroom under the 96 area

// Status → percentage of CHART_BAR_MAX_HEIGHT. Today's bar gets a minimum
// height even when empty so the dashed outline has a box to render against.
function barFraction(d: WeekDay): number {
  switch (d.status) {
    case 'done':
      return 1.0;
    case 'skipped':
      return 0.3;
    case 'pending':
      if (d.isToday) return 0.25;
      if (d.isPast) return 0.3;
      return 0; // future — shouldn't happen in current-week view, defensive
    case 'none':
      // Today with no row → keep the dashed outline visible. Otherwise a
      // small grey stub so the slot remains visible but de-emphasised.
      return d.isToday ? 0.25 : 0.15;
  }
}

const WeeklyChart = ({ t, data }: WeeklyChartProps): JSX.Element => {
  const { t: translate } = useTranslation();
  const total = data.length;
  const done = data.filter((d) => d.status === 'done').length;

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
          {translate('profile.this_week')}
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
          {translate('profile.n_of_m_done', { done, total })}
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
        {data.map((d) => {
          const fraction = barFraction(d);
          const h = Math.max(Math.round(fraction * CHART_BAR_MAX_HEIGHT), fraction > 0 ? 4 : 0);
          // 'none' (except today) renders the muted grey stub; pending-past
          // and skipped use the solid accent treatment so the "you missed
          // this" penalty bar reads in the brand colour.
          const muted = d.status === 'none' && !d.isToday;
          return (
            <View key={d.date} style={{ flex: 1, height: '100%', justifyContent: 'flex-end' }}>
              <ChartBar height={h} muted={muted} today={d.isToday} t={t} />
            </View>
          );
        })}
      </View>

      {/* Day labels */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {data.map((d) => (
          <Text
            key={`${d.date}-label`}
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: 11,
              fontWeight: '500',
              color: d.isToday ? t.accent : t.fg3,
              fontFamily: FONT_BODY_MEDIUM,
            }}
          >
            {d.weekday}
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
// ProfileScreen
// ---------------------------------------------------------------------------

// Pre-formatted display strings — the route does the number formatting and
// passes '—' for loading states, keeping ProfileScreen pure presentation.
export interface ProfileMetrics {
  streak: string;
  points: string;
  completion: string;
}

const LOADING_METRICS: ProfileMetrics = {
  streak: '—',
  points: '—',
  completion: '—',
};

export interface ProfileScreenProps {
  theme: ThemeName;
  name: string;
  // Shown as the secondary line below the name. Optional so the component
  // gracefully handles the brief window before auth.user lands.
  email?: string;
  metrics?: ProfileMetrics;
  /**
   * 7 entries Monday → Sunday for the current local week. The route is
   * responsible for building the skeleton + merging fetched rows. If absent
   * (e.g. during the initial fetch), the chart renders an empty 7-day
   * placeholder so the layout doesn't jump.
   */
  week?: WeekDay[];
  onSettings?: () => void;
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

// Empty 7-day placeholder used while the route's fetch is in flight. All
// 'none', no isToday flag — the chart renders 7 muted stubs so the layout
// doesn't jump. The route swaps this for real data once fetchWeek resolves.
const PLACEHOLDER_WEEK: WeekDay[] = Array.from({ length: 7 }).map((_, i) => ({
  date: `placeholder-${i}`,
  weekday: '',
  isToday: false,
  isPast: false,
  status: 'none' as const,
}));

export default function ProfileScreen({
  theme,
  name,
  email,
  metrics = LOADING_METRICS,
  week = PLACEHOLDER_WEEK,
  onSettings,
  footer,
}: ProfileScreenProps): JSX.Element {
  const t: Theme = theme === 'dark' ? THEMES.dark : THEMES.light;
  const { t: translate } = useTranslation();
  const initials = computeInitials(name);

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
            {translate('profile.title')}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={translate('settings.cog_a11y')}
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
              numberOfLines={1}
              ellipsizeMode="tail"
              style={{
                fontSize: 13,
                color: t.fg3,
                marginTop: 2,
                fontWeight: '500',
                fontFamily: FONT_BODY_MEDIUM,
              }}
            >
              {email ?? '—'}
            </Text>
          </View>
        </View>

        {/* Metric row */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          <Metric
            value={metrics.streak}
            suffix={translate('profile.days_suffix')}
            label={translate('profile.streak')}
            t={t}
          />
          <Metric value={metrics.points} label={translate('profile.points')} t={t} />
          <Metric
            value={metrics.completion}
            suffix="%"
            label={translate('profile.completion')}
            t={t}
          />
        </View>

        <WeeklyChart t={t} data={week} />
      </ScrollView>

      {footer}
    </View>
  );
}
