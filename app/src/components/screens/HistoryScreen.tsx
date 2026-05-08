// Daily Challenges — History screen (React Native port of handoff/history-screen.jsx).
// Streak stats · monthly calendar (amber-filled completed days) · last-7-days list.
//
// Requires: react-native-svg (install via `npx expo install react-native-svg`).

import { type JSX, type ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

// ---------------------------------------------------------------------------
// Theme tokens (mirror handoff exactly — Warm Amber on Stone neutrals)
// ---------------------------------------------------------------------------

const THEMES = {
  light: {
    bg: '#FAFAF7',
    surface: '#FFFFFF',
    fg1: '#18221E',
    fg2: '#4A574F',
    fg3: '#7C8881',
    fg4: '#B0B8B3',
    border: '#ECEAE3',
    border2: '#DAD8D0',
    accent: '#D97706',
    onAccent: '#FFFFFF',
    catHealth: '#B5523F',
    catHealthBg: 'rgba(181,82,63,0.12)',
    catMental: '#7E6FA8',
    catMentalBg: 'rgba(126,111,168,0.12)',
    catProd: '#2C7A7B',
    catProdBg: 'rgba(44,122,123,0.14)',
    catSocial: '#1D9E75',
    catSocialBg: 'rgba(29,158,117,0.14)',
  },
  dark: {
    bg: '#15161A',
    surface: '#1E1F24',
    fg1: '#F2EFE6',
    fg2: '#C2BFB4',
    fg3: '#8A8576',
    fg4: '#5A574E',
    border: '#2D2F37',
    border2: '#3D404A',
    accent: '#F5B14E',
    onAccent: '#15161A',
    catHealth: '#E07863',
    catHealthBg: 'rgba(224,120,99,0.16)',
    catMental: '#A89BD0',
    catMentalBg: 'rgba(168,155,208,0.16)',
    catProd: '#5BA8A9',
    catProdBg: 'rgba(91,168,169,0.18)',
    catSocial: '#4DC097',
    catSocialBg: 'rgba(77,192,151,0.18)',
  },
} as const;

type ThemeName = keyof typeof THEMES;
type Theme = (typeof THEMES)[ThemeName];

const FONT_DISPLAY = 'PlusJakartaSans_700Bold';
const FONT_BODY = 'Inter_400Regular';
const FONT_BODY_MEDIUM = 'Inter_500Medium';
const FONT_BODY_SEMI = 'Inter_600SemiBold';

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export type HistoryCategory = 'health' | 'mental' | 'productivity' | 'social';

const HIST_CATS: Record<HistoryCategory, { label: string; color: (t: Theme) => string; bg: (t: Theme) => string }> = {
  health: {
    label: 'Health',
    color: (t): string => t.catHealth,
    bg: (t): string => t.catHealthBg,
  },
  mental: {
    label: 'Mental',
    color: (t): string => t.catMental,
    bg: (t): string => t.catMentalBg,
  },
  productivity: {
    label: 'Productivity',
    color: (t): string => t.catProd,
    bg: (t): string => t.catProdBg,
  },
  social: {
    label: 'Social',
    color: (t): string => t.catSocial,
    bg: (t): string => t.catSocialBg,
  },
};

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

interface ChevronProps {
  size?: number;
  color: string;
  sw?: number;
}

const ChevLeft = ({ size = 18, color, sw = 1.5 }: ChevronProps): JSX.Element => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <Path d="m15 18-6-6 6-6" />
  </Svg>
);

const ChevRight = ({ size = 18, color, sw = 1.5 }: ChevronProps): JSX.Element => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <Path d="m9 18 6-6-6-6" />
  </Svg>
);

interface CheckSmIconProps {
  size?: number;
  color: string;
  sw?: number;
}

const CheckSm = ({ size = 13, color, sw = 2.8 }: CheckSmIconProps): JSX.Element => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 6 9 17l-5-5" />
  </Svg>
);

const XSm = ({ size = 11, color, sw = 2 }: CheckSmIconProps): JSX.Element => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M18 6 6 18M6 6l12 12" />
  </Svg>
);

// ---------------------------------------------------------------------------
// Stats row
// ---------------------------------------------------------------------------

interface HStatProps {
  value: string;
  suffix?: string;
  label: string;
  t: Theme;
}

const HStat = ({ value, suffix, label, t }: HStatProps): JSX.Element => (
  <View style={{ flex: 1 }}>
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
      <Text
        style={{
          fontFamily: FONT_DISPLAY,
          fontSize: 24,
          fontWeight: '700',
          color: t.fg1,
          fontVariant: ['tabular-nums'],
          letterSpacing: -0.6,
          lineHeight: 24,
        }}
      >
        {value}
      </Text>
      {suffix !== undefined && (
        <Text
          style={{
            fontSize: 12,
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
        marginTop: 6,
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
// Calendar
// ---------------------------------------------------------------------------

type DayStatus = 'done' | 'today' | 'skipped' | 'future';

interface DayCell {
  day: number;
  status: DayStatus;
}

interface CalendarMonth {
  monthLabel: string;
  /** 0=Mon..6=Sun, weekday of the 1st of the month */
  startWeekday: number;
  daysInMonth: number;
  /** 1-based day-of-month */
  todayDay: number;
  /** 1-based days marked skipped (must be < todayDay) */
  skippedDays?: number[];
  canGoNext?: boolean;
}

// Default fixture matches handoff/history-screen.jsx — May 2026, today = Wed May 6,
// May 1 = Friday (weekday index 4 with Monday-first weeks), days 2 & 5 skipped.
const DEFAULT_MONTH: CalendarMonth = {
  monthLabel: 'May 2026',
  startWeekday: 4,
  daysInMonth: 31,
  todayDay: 6,
  skippedDays: [2, 5],
  canGoNext: false,
};

function buildMonth(m: CalendarMonth): (DayCell | null)[] {
  const cells: (DayCell | null)[] = [];
  for (let i = 0; i < m.startWeekday; i++) cells.push(null);
  const skipped = new Set(m.skippedDays ?? []);
  for (let d = 1; d <= m.daysInMonth; d++) {
    let status: DayStatus = 'future';
    if (d < m.todayDay) status = skipped.has(d) ? 'skipped' : 'done';
    else if (d === m.todayDay) status = 'today';
    cells.push({ day: d, status });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

interface LegendDotProps {
  dot?: string;
  ringColor?: string;
  small?: boolean;
}

const LegendDot = ({ dot, ringColor, small }: LegendDotProps): JSX.Element => (
  <View
    style={{
      width: small ? 6 : 10,
      height: small ? 6 : 10,
      borderRadius: 99,
      backgroundColor: dot ?? 'transparent',
      borderWidth: ringColor ? 1.5 : 0,
      borderColor: ringColor ?? 'transparent',
    }}
  />
);

interface LegendItemProps {
  label: string;
  t: Theme;
  dot?: string;
  ringColor?: string;
  small?: boolean;
}

const LegendItem = ({ label, t, dot, ringColor, small }: LegendItemProps): JSX.Element => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
    <LegendDot dot={dot} ringColor={ringColor} small={small} />
    <Text
      style={{
        fontSize: 11,
        color: t.fg3,
        fontWeight: '500',
        fontFamily: FONT_BODY_MEDIUM,
      }}
    >
      {label}
    </Text>
  </View>
);

interface CalendarProps {
  t: Theme;
  month: CalendarMonth;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
}

const Calendar = ({ t, month, onPrevMonth, onNextMonth }: CalendarProps): JSX.Element => {
  const cells = buildMonth(month);
  const canGoNext = month.canGoNext === true;

  // Split into 7-cell week rows so we can use flex (RN has no CSS Grid).
  const rows: (DayCell | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }

  return (
    <View
      style={{
        backgroundColor: t.surface,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: t.border,
      }}
    >
      {/* Month nav */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 14,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          onPress={onPrevMonth}
          hitSlop={10}
          style={{ padding: 4 }}
        >
          <ChevLeft color={t.fg2} />
        </Pressable>
        <Text
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 16,
            fontWeight: '700',
            color: t.fg1,
            letterSpacing: -0.16,
          }}
        >
          {month.monthLabel}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next month"
          accessibilityState={{ disabled: !canGoNext }}
          disabled={!canGoNext}
          onPress={onNextMonth}
          hitSlop={10}
          style={{ padding: 4 }}
        >
          <ChevRight color={canGoNext ? t.fg2 : t.fg4} />
        </Pressable>
      </View>

      {/* Weekday header */}
      <View style={{ flexDirection: 'row', gap: 4, marginBottom: 8 }}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <Text
            key={`${d}-${i}`}
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: 11,
              fontWeight: '600',
              color: t.fg3,
              letterSpacing: 0.66,
              fontFamily: FONT_BODY_SEMI,
            }}
          >
            {d}
          </Text>
        ))}
      </View>

      {/* Days grid */}
      <View style={{ gap: 4 }}>
        {rows.map((row, rIdx) => (
          <View key={rIdx} style={{ flexDirection: 'row', gap: 4 }}>
            {row.map((c, cIdx) => {
              if (!c) {
                return <View key={cIdx} style={{ flex: 1, aspectRatio: 1 }} />;
              }
              return <DayBox key={cIdx} cell={c} t={t} />;
            })}
          </View>
        ))}
      </View>

      {/* Legend */}
      <View
        style={{
          flexDirection: 'row',
          gap: 16,
          marginTop: 14,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: t.border,
          flexWrap: 'wrap',
        }}
      >
        <LegendItem label="Done" t={t} dot={t.accent} />
        <LegendItem label="Today" t={t} ringColor={t.accent} />
        <LegendItem label="Skipped" t={t} dot={t.border2} small />
      </View>
    </View>
  );
};

interface DayBoxProps {
  cell: DayCell;
  t: Theme;
}

const DayBox = ({ cell, t }: DayBoxProps): JSX.Element => {
  const { day, status } = cell;
  const isDone = status === 'done';
  const isToday = status === 'today';
  const isSkipped = status === 'skipped';
  const isFuture = status === 'future';

  const textColor = isDone
    ? t.onAccent
    : isToday
      ? t.accent
      : isSkipped
        ? t.fg4
        : t.fg3;

  return (
    <View
      style={{
        flex: 1,
        aspectRatio: 1,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isDone ? t.accent : 'transparent',
        borderWidth: 1.5,
        borderColor: isToday ? t.accent : 'transparent',
        opacity: isFuture ? 0.45 : 1,
      }}
    >
      <Text
        style={{
          fontFamily: isDone || isToday ? FONT_BODY_SEMI : FONT_BODY_MEDIUM,
          fontSize: 13,
          fontWeight: isDone || isToday ? '600' : '500',
          color: textColor,
          fontVariant: ['tabular-nums'],
        }}
      >
        {day}
      </Text>
      {isSkipped && (
        <View
          style={{
            position: 'absolute',
            bottom: 4,
            width: 4,
            height: 4,
            borderRadius: 99,
            backgroundColor: t.border2,
          }}
        />
      )}
    </View>
  );
};

// ---------------------------------------------------------------------------
// Last-7-days list
// ---------------------------------------------------------------------------

export type RowStatus = 'done' | 'skipped' | 'today';

export interface HistoryRowData {
  date: string;
  day: string; // weekday eyebrow (MON, TUE, ...)
  category: HistoryCategory;
  title: string;
  status: RowStatus;
}

interface HistoryRowProps extends HistoryRowData {
  t: Theme;
  last?: boolean;
}

const HistoryRow = ({ date, day, category, title, status, t, last = false }: HistoryRowProps): JSX.Element => {
  const cat = HIST_CATS[category];
  const catColor = cat.color(t);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 14,
        paddingHorizontal: 4,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: t.border,
      }}
    >
      {/* Date pill */}
      <View style={{ width: 38, alignItems: 'center' }}>
        <Text
          style={{
            fontSize: 10,
            color: t.fg3,
            fontWeight: '600',
            letterSpacing: 0.8,
            textTransform: 'uppercase',
            fontFamily: FONT_BODY_SEMI,
          }}
        >
          {day}
        </Text>
        <Text
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 17,
            fontWeight: '700',
            color: t.fg1,
            fontVariant: ['tabular-nums'],
            lineHeight: 19,
            letterSpacing: -0.34,
            marginTop: 1,
          }}
        >
          {date}
        </Text>
      </View>

      {/* Category color bar */}
      <View
        style={{
          width: 3,
          height: 32,
          borderRadius: 2,
          backgroundColor: catColor,
        }}
      />

      {/* Title + category label */}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={{
            fontSize: 14,
            color: t.fg1,
            fontWeight: '500',
            lineHeight: 18,
            fontFamily: FONT_BODY_MEDIUM,
            opacity: status === 'skipped' ? 0.55 : 1,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontSize: 11,
            color: catColor,
            fontWeight: '600',
            letterSpacing: 0.44,
            textTransform: 'uppercase',
            marginTop: 3,
            fontFamily: FONT_BODY_SEMI,
          }}
        >
          {cat.label}
        </Text>
      </View>

      {/* Status badge — done (filled) or skipped (outline X). Today = no badge. */}
      {status === 'done' && (
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 99,
            backgroundColor: t.accent,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CheckSm size={13} color={t.onAccent} sw={2.8} />
        </View>
      )}
      {status === 'skipped' && (
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 99,
            borderWidth: 1.5,
            borderColor: t.border2,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <XSm size={11} color={t.fg4} sw={2} />
        </View>
      )}
    </View>
  );
};

// ---------------------------------------------------------------------------
// HistoryScreen
// ---------------------------------------------------------------------------

const DEFAULT_LAST7: HistoryRowData[] = [
  { date: '6', day: 'WED', category: 'health', title: '20-min walk without your phone', status: 'today' },
  { date: '5', day: 'TUE', category: 'mental', title: 'Pause and breathe for 2 minutes', status: 'skipped' },
  { date: '4', day: 'MON', category: 'productivity', title: "Write tomorrow’s three priorities", status: 'done' },
  { date: '3', day: 'SUN', category: 'social', title: "Call someone you haven’t in a while", status: 'done' },
  { date: '2', day: 'SAT', category: 'health', title: 'Stretch for 5 minutes after waking', status: 'skipped' },
  { date: '1', day: 'FRI', category: 'mental', title: "Write 3 things you’re grateful for", status: 'done' },
  { date: '30', day: 'THU', category: 'productivity', title: 'Inbox zero before lunch', status: 'done' },
];

export interface HistoryScreenStats {
  current: number;
  longest: number;
  rate30d: number;
}

const DEFAULT_STATS: HistoryScreenStats = {
  current: 14,
  longest: 28,
  rate30d: 83,
};

export interface HistoryScreenProps {
  theme: ThemeName;
  stats?: HistoryScreenStats;
  month?: CalendarMonth;
  last7?: HistoryRowData[];
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
  /** Optional bottom slot to layer a tab bar on top of the screen. */
  footer?: ReactNode;
}

export default function HistoryScreen({
  theme,
  stats = DEFAULT_STATS,
  month = DEFAULT_MONTH,
  last7 = DEFAULT_LAST7,
  onPrevMonth,
  onNextMonth,
  footer,
}: HistoryScreenProps): JSX.Element {
  const t: Theme = theme === 'dark' ? THEMES.dark : THEMES.light;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 60, paddingHorizontal: 20, paddingBottom: 180 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text
          accessibilityRole="header"
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 22,
            fontWeight: '700',
            color: t.fg1,
            marginBottom: 18,
            letterSpacing: -0.55,
          }}
        >
          History
        </Text>

        {/* Streak stats row */}
        <View
          style={
            {
              flexDirection: 'row',
              gap: 4,
              marginBottom: 22,
              paddingVertical: 14,
              borderTopWidth: 1,
              borderTopColor: t.border,
              borderBottomWidth: 1,
              borderBottomColor: t.border,
            } satisfies ViewStyle
          }
        >
          <HStat value={String(stats.current)} suffix="days" label="Current" t={t} />
          <View style={{ width: 1, alignSelf: 'stretch', marginHorizontal: 8, backgroundColor: t.border }} />
          <HStat value={String(stats.longest)} suffix="days" label="Longest" t={t} />
          <View style={{ width: 1, alignSelf: 'stretch', marginHorizontal: 8, backgroundColor: t.border }} />
          <HStat value={String(stats.rate30d)} suffix="%" label="30-day rate" t={t} />
        </View>

        {/* Calendar */}
        <Calendar t={t} month={month} onPrevMonth={onPrevMonth} onNextMonth={onNextMonth} />

        {/* Last-7-days list */}
        <Text
          style={{
            fontSize: 11,
            color: t.fg3,
            fontWeight: '600',
            letterSpacing: 0.88,
            textTransform: 'uppercase',
            marginTop: 24,
            marginBottom: 6,
            fontFamily: FONT_BODY_SEMI,
          }}
        >
          Last 7 days
        </Text>
        <View>
          {last7.map((row, i) => (
            <HistoryRow key={`${row.date}-${row.day}`} {...row} t={t} last={i === last7.length - 1} />
          ))}
        </View>
      </ScrollView>

      {footer}
    </View>
  );
}
