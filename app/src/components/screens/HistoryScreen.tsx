// Daily Challenges — History screen.
// Streak stats · monthly calendar · last-7-days list · day-tap detail modal.
//
// Pulls real data from challengeStore (stats + history). Keeps modal state
// local — it's only useful while the screen is mounted, not worth a slot in
// the global store.
//
// Requires: react-native-svg.

import { useEffect, useMemo, useState, type JSX, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

import {
  useChallengeStore,
  type ChallengeCategory,
  type ChallengeStatus,
  type HistoryEntry,
} from '@/store/challengeStore';

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
    accentBg: '#FEF6E7',
    onAccent: '#FFFFFF',
    catHealth: '#B5523F',
    catHealthBg: 'rgba(181,82,63,0.12)',
    catMental: '#7E6FA8',
    catMentalBg: 'rgba(126,111,168,0.12)',
    catProd: '#D97706',
    catProdBg: '#FEF6E7',
    catSocial: '#1D9E75',
    catSocialBg: 'rgba(29,158,117,0.14)',
    overlay: 'rgba(15,30,25,0.45)',
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
    accentBg: 'rgba(245,177,78,0.12)',
    onAccent: '#15161A',
    catHealth: '#E07863',
    catHealthBg: 'rgba(224,120,99,0.16)',
    catMental: '#A89BD0',
    catMentalBg: 'rgba(168,155,208,0.16)',
    catProd: '#F5B14E',
    catProdBg: 'rgba(245,177,78,0.12)',
    catSocial: '#4DC097',
    catSocialBg: 'rgba(77,192,151,0.18)',
    overlay: 'rgba(0,0,0,0.55)',
  },
} as const;

type ThemeName = keyof typeof THEMES;
type Theme = (typeof THEMES)[ThemeName];

const FONT_DISPLAY = 'PlusJakartaSans_700Bold';
const FONT_BODY_MEDIUM = 'Inter_500Medium';
const FONT_BODY_SEMI = 'Inter_600SemiBold';

// ---------------------------------------------------------------------------
// Categories — finance + productivity reuse existing tokens (no new surfaces).
// Mirrors HomeScreen's categoryColors helper to keep the look consistent.
// ---------------------------------------------------------------------------

function catColor(category: ChallengeCategory, t: Theme): string {
  switch (category) {
    case 'health':
      return t.catHealth;
    case 'mental':
    case 'finance':
      return t.catMental;
    case 'productivity':
      return t.catProd;
    case 'social':
      return t.catSocial;
  }
}

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

interface SmIconProps {
  size?: number;
  color: string;
  sw?: number;
}

const CheckSm = ({ size = 13, color, sw = 2.8 }: SmIconProps): JSX.Element => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 6 9 17l-5-5" />
  </Svg>
);

const XSm = ({ size = 11, color, sw = 2 }: SmIconProps): JSX.Element => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M18 6 6 18M6 6l12 12" />
  </Svg>
);

const XLg = ({ size = 18, color, sw = 1.8 }: SmIconProps): JSX.Element => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M18 6 6 18M6 6l12 12" />
  </Svg>
);

// ---------------------------------------------------------------------------
// Date helpers (kept inline — date-fns / dayjs are out of scope)
// ---------------------------------------------------------------------------

function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function firstOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function lastOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

// Monday-first weekday: Mon=0..Sun=6.
function mondayIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}

// Parse a 'YYYY-MM-DD' string into a local-midnight Date. Avoids `new Date(s)`,
// which interprets the form as UTC and shifts ahead by the local TZ offset.
function parseLocalDate(s: string): Date {
  const y = Number(s.slice(0, 4));
  const m = Number(s.slice(5, 7));
  const d = Number(s.slice(8, 10));
  return new Date(y, m - 1, d);
}

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

interface DayCell {
  day: number;
  dateStr: string;
  isToday: boolean;
  isFuture: boolean;
  entry: HistoryEntry | undefined;
}

function buildCells(
  viewMonth: Date,
  todayStr: string,
  entryByDate: Map<string, HistoryEntry>,
): (DayCell | null)[] {
  const cells: (DayCell | null)[] = [];
  const start = firstOfMonth(viewMonth);
  const end = lastOfMonth(viewMonth);
  const leading = mondayIndex(start);
  for (let i = 0; i < leading; i++) cells.push(null);
  for (let d = 1; d <= end.getDate(); d++) {
    const dt = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d);
    const dateStr = formatLocalDate(dt);
    cells.push({
      day: d,
      dateStr,
      isToday: dateStr === todayStr,
      isFuture: dateStr > todayStr,
      entry: entryByDate.get(dateStr),
    });
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
  monthLabel: string;
  weekdayLetters: string[];
  cells: (DayCell | null)[];
  canGoNext: boolean;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onPickDay: (cell: DayCell) => void;
  legendDone: string;
  legendToday: string;
  legendSkipped: string;
}

const Calendar = ({
  t,
  monthLabel,
  weekdayLetters,
  cells,
  canGoNext,
  onPrevMonth,
  onNextMonth,
  onPickDay,
  legendDone,
  legendToday,
  legendSkipped,
}: CalendarProps): JSX.Element => {
  const rows: (DayCell | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

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
          {monthLabel}
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
        {weekdayLetters.map((d, i) => (
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
              textTransform: 'uppercase',
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
              return <DayBox key={cIdx} cell={c} t={t} onPickDay={onPickDay} />;
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
        <LegendItem label={legendDone} t={t} dot={t.accent} />
        <LegendItem label={legendToday} t={t} ringColor={t.accent} />
        <LegendItem label={legendSkipped} t={t} dot={t.border2} small />
      </View>
    </View>
  );
};

interface DayBoxProps {
  cell: DayCell;
  t: Theme;
  onPickDay: (cell: DayCell) => void;
}

const DayBox = ({ cell, t, onPickDay }: DayBoxProps): JSX.Element => {
  const { day, isToday, isFuture, entry } = cell;
  const status = entry?.status;
  const isDone = status === 'done';
  const isSkipped = status === 'skipped';

  // Today + already done → done style wins (filled circle). Today + not yet
  // done → outlined ring. Past pending rows render as plain greyed numbers,
  // matching the screenshot ("the day passed, nothing to celebrate").
  const showDoneStyle = isDone;
  const showTodayRing = isToday && !isDone;

  const textColor = showDoneStyle
    ? t.onAccent
    : showTodayRing
      ? t.accent
      : isFuture
        ? t.fg4
        : isSkipped
          ? t.fg4
          : t.fg2;

  const tappable = !!entry && !isFuture;

  const inner = (
    <View
      style={{
        flex: 1,
        aspectRatio: 1,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: showDoneStyle ? t.accent : 'transparent',
        borderWidth: 1.5,
        borderColor: showTodayRing ? t.accent : 'transparent',
        opacity: isFuture ? 0.45 : 1,
      }}
    >
      <Text
        style={{
          fontFamily: showDoneStyle || showTodayRing ? FONT_BODY_SEMI : FONT_BODY_MEDIUM,
          fontSize: 13,
          fontWeight: showDoneStyle || showTodayRing ? '600' : '500',
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

  if (!tappable) {
    return <View style={{ flex: 1 }}>{inner}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={cell.dateStr}
      onPress={(): void => onPickDay(cell)}
      style={{ flex: 1 }}
    >
      {inner}
    </Pressable>
  );
};

// ---------------------------------------------------------------------------
// Last-7-days list
// ---------------------------------------------------------------------------

interface HistoryRowProps {
  t: Theme;
  entry: HistoryEntry;
  weekday: string; // localized short weekday, e.g. "WED"
  categoryLabel: string;
  last: boolean;
}

const HistoryRow = ({ t, entry, weekday, categoryLabel, last }: HistoryRowProps): JSX.Element => {
  const color = catColor(entry.category, t);
  const dayNum = String(parseInt(entry.date.slice(8, 10), 10));
  const isDone = entry.status === 'done';
  const isSkipped = entry.status === 'skipped';

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
          {weekday}
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
          {dayNum}
        </Text>
      </View>

      {/* Category color bar */}
      <View
        style={{
          width: 3,
          height: 32,
          borderRadius: 2,
          backgroundColor: color,
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
            opacity: isSkipped ? 0.55 : 1,
          }}
        >
          {entry.title}
        </Text>
        <Text
          style={{
            fontSize: 11,
            color,
            fontWeight: '600',
            letterSpacing: 0.44,
            textTransform: 'uppercase',
            marginTop: 3,
            fontFamily: FONT_BODY_SEMI,
          }}
        >
          {categoryLabel}
        </Text>
      </View>

      {/* Status badge */}
      {isDone && (
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
      {isSkipped && (
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
// Day-tap detail modal
// ---------------------------------------------------------------------------

interface DetailModalProps {
  t: Theme;
  entry: HistoryEntry | null;
  locale: string;
  onClose: () => void;
  statusLabel: (s: ChallengeStatus) => string;
  categoryLabel: (c: ChallengeCategory) => string;
  closeLabel: string;
}

const DetailModal = ({
  t,
  entry,
  locale,
  onClose,
  statusLabel,
  categoryLabel,
  closeLabel,
}: DetailModalProps): JSX.Element => {
  if (!entry) {
    // Modal still rendered (visible=false) so it can animate out cleanly.
    return <Modal visible={false} transparent animationType="fade" onRequestClose={onClose} />;
  }
  const dt = parseLocalDate(entry.date);
  const fullDate = dt.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const color = catColor(entry.category, t);

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={closeLabel}
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: t.overlay,
          justifyContent: 'center',
          paddingHorizontal: 24,
        }}
      >
        {/* Inner Pressable swallows taps so the card itself doesn't dismiss. */}
        <Pressable
          onPress={(): void => {}}
          style={{
            backgroundColor: t.surface,
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: t.border,
            gap: 14,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Text
              style={{
                flex: 1,
                fontSize: 13,
                color: t.fg3,
                fontWeight: '500',
                fontFamily: FONT_BODY_MEDIUM,
              }}
            >
              {fullDate}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={closeLabel}
              onPress={onClose}
              hitSlop={10}
              style={{ padding: 4, marginRight: -4, marginTop: -4 }}
            >
              <XLg color={t.fg3} />
            </Pressable>
          </View>

          <Text
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 18,
              fontWeight: '700',
              color: t.fg1,
              letterSpacing: -0.36,
              lineHeight: 24,
            }}
          >
            {entry.title}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View
              style={{
                width: 3,
                height: 16,
                borderRadius: 2,
                backgroundColor: color,
              }}
            />
            <Text
              style={{
                fontSize: 11,
                color,
                fontWeight: '600',
                letterSpacing: 0.44,
                textTransform: 'uppercase',
                fontFamily: FONT_BODY_SEMI,
              }}
            >
              {categoryLabel(entry.category)}
            </Text>
          </View>

          <StatusBadge t={t} status={entry.status} label={statusLabel(entry.status)} />
        </Pressable>
      </Pressable>
    </Modal>
  );
};

interface StatusBadgeProps {
  t: Theme;
  status: ChallengeStatus;
  label: string;
}

const StatusBadge = ({ t, status, label }: StatusBadgeProps): JSX.Element => {
  const isDone = status === 'done';
  const bg = isDone ? t.accent : status === 'skipped' ? t.border : t.surface;
  const fg = isDone ? t.onAccent : status === 'skipped' ? t.fg2 : t.fg2;
  const borderColor = isDone ? t.accent : t.border2;
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 99,
        backgroundColor: bg,
        borderWidth: 1,
        borderColor,
      }}
    >
      {isDone && <CheckSm size={11} color={t.onAccent} sw={2.6} />}
      <Text
        style={{
          fontSize: 11,
          color: fg,
          fontWeight: '600',
          letterSpacing: 0.44,
          textTransform: 'uppercase',
          fontFamily: FONT_BODY_SEMI,
        }}
      >
        {label}
      </Text>
    </View>
  );
};

// ---------------------------------------------------------------------------
// HistoryScreen
// ---------------------------------------------------------------------------

export interface HistoryScreenProps {
  theme: ThemeName;
  /** Optional bottom slot to layer a tab bar on top of the screen. */
  footer?: ReactNode;
}

export default function HistoryScreen({ theme, footer }: HistoryScreenProps): JSX.Element {
  const { t: tr, i18n } = useTranslation();
  const t: Theme = theme === 'dark' ? THEMES.dark : THEMES.light;

  const stats = useChallengeStore((s) => s.stats);
  const history = useChallengeStore((s) => s.history);
  const fetchStats = useChallengeStore((s) => s.fetchStats);
  const fetchHistory = useChallengeStore((s) => s.fetchHistory);

  // Snapshot today once per mount. Used for "today" calendar marking and as
  // the upper bound of the next-month chevron — recomputing per render would
  // cause the lookup map and last-7 list to thrash.
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => formatLocalDate(today), [today]);

  const [viewMonth, setViewMonth] = useState<Date>(() => firstOfMonth(today));
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);

  // Pull stats once per mount — Profile/Home do the same, and the screen
  // visit is the natural refresh trigger.
  useEffect(() => {
    void fetchStats().then((res) => {
      if (res.error) console.warn('[fetchStats]', res.error);
    });
  }, [fetchStats]);

  // Refetch history whenever the visible month changes (and on mount).
  useEffect(() => {
    const start = firstOfMonth(viewMonth);
    const end = lastOfMonth(viewMonth);
    void fetchHistory(start, end).then((res) => {
      if (res.error) console.warn('[fetchHistory]', res.error);
    });
  }, [viewMonth, fetchHistory]);

  // O(1) lookup per cell.
  const entryByDate = useMemo(() => {
    const map = new Map<string, HistoryEntry>();
    for (const e of history ?? []) map.set(e.date, e);
    return map;
  }, [history]);

  const cells = useMemo(
    () => buildCells(viewMonth, todayStr, entryByDate),
    [viewMonth, todayStr, entryByDate],
  );

  // Last-7-days list: today + 6 prior days, most-recent first. Crosses month
  // boundaries on the 1st-7th — the store's `history` only covers the
  // current viewMonth, so early-month entries from the previous month aren't
  // visible. That's the same trade-off as keeping fetches scoped to the
  // visible month; refetching on month flip keeps things simple.
  const last7 = useMemo<HistoryEntry[]>(() => {
    if (!history) return [];
    const cutoff = new Date(today);
    cutoff.setDate(cutoff.getDate() - 6);
    const cutoffStr = formatLocalDate(cutoff);
    return history
      .filter((e) => e.date >= cutoffStr && e.date <= todayStr)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [history, today, todayStr]);

  const locale = i18n.language === 'bg' ? 'bg-BG' : 'en-GB';

  const monthLabel = useMemo(
    () => viewMonth.toLocaleDateString(locale, { month: 'long', year: 'numeric' }),
    [viewMonth, locale],
  );

  // Mon..Sun letters, locale-aware. 2024-01-01 is a Monday, so we walk
  // forward 7 days from that anchor.
  const weekdayLetters = useMemo(() => {
    const letters: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(2024, 0, 1 + i);
      letters.push(d.toLocaleDateString(locale, { weekday: 'narrow' }));
    }
    return letters;
  }, [locale]);

  // Disable next-month chevron when we'd jump past the current month.
  const canGoNext = useMemo(() => {
    const next = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1);
    const thisMonth = firstOfMonth(today);
    return next.getTime() <= thisMonth.getTime();
  }, [viewMonth, today]);

  const handlePrev = (): void => {
    setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  };
  const handleNext = (): void => {
    if (!canGoNext) return;
    setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));
  };

  const statusLabel = (s: ChallengeStatus): string =>
    tr(`history.modal.status.${s}`);
  const categoryLabel = (c: ChallengeCategory): string =>
    tr(`categories.${c}`);

  const last7Empty = (history?.length ?? 0) > 0 ? last7.length === 0 : true;

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
          {tr('history.title')}
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
          <HStat
            value={stats ? String(stats.current_streak) : '—'}
            suffix={stats ? tr('history.days_suffix') : undefined}
            label={tr('history.current')}
            t={t}
          />
          <View style={{ width: 1, alignSelf: 'stretch', marginHorizontal: 8, backgroundColor: t.border }} />
          <HStat
            value={stats ? String(stats.longest_streak) : '—'}
            suffix={stats ? tr('history.days_suffix') : undefined}
            label={tr('history.longest')}
            t={t}
          />
          <View style={{ width: 1, alignSelf: 'stretch', marginHorizontal: 8, backgroundColor: t.border }} />
          <HStat
            value={stats ? String(Math.round(stats.d30_completion_rate * 100)) : '—'}
            suffix={stats ? '%' : undefined}
            label={tr('history.rate_30d')}
            t={t}
          />
        </View>

        {/* Calendar */}
        <Calendar
          t={t}
          monthLabel={monthLabel}
          weekdayLetters={weekdayLetters}
          cells={cells}
          canGoNext={canGoNext}
          onPrevMonth={handlePrev}
          onNextMonth={handleNext}
          onPickDay={(c): void => {
            if (c.entry) setSelectedEntry(c.entry);
          }}
          legendDone={tr('history.legend_done')}
          legendToday={tr('history.legend_today')}
          legendSkipped={tr('history.legend_skipped')}
        />

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
          {tr('history.last_7_days')}
        </Text>
        {last7Empty ? (
          <Text
            style={{
              fontSize: 13,
              color: t.fg3,
              fontFamily: FONT_BODY_MEDIUM,
              fontWeight: '500',
              paddingVertical: 14,
              paddingHorizontal: 4,
            }}
          >
            {tr('history.empty')}
          </Text>
        ) : (
          <View>
            {last7.map((entry, i) => {
              const weekday = parseLocalDate(entry.date)
                .toLocaleDateString(locale, { weekday: 'short' })
                .toUpperCase();
              return (
                <HistoryRow
                  key={entry.id}
                  t={t}
                  entry={entry}
                  weekday={weekday}
                  categoryLabel={categoryLabel(entry.category)}
                  last={i === last7.length - 1}
                />
              );
            })}
          </View>
        )}
      </ScrollView>

      {footer}

      <DetailModal
        t={t}
        entry={selectedEntry}
        locale={locale}
        onClose={(): void => setSelectedEntry(null)}
        statusLabel={statusLabel}
        categoryLabel={categoryLabel}
        closeLabel={tr('history.modal.close')}
      />
    </View>
  );
}
