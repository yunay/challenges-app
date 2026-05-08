// Daily Challenges — Onboarding Survey screen, step 2 of 5
// (React Native port of handoff/survey-screen.jsx). "What do you want to improve?"
//
// Requires: react-native-svg (install via `npx expo install react-native-svg`).

import { useEffect, useRef, useState, type JSX } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

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
    border2: '#DAD8D0',
    accent: '#D97706',
    accentBg: '#FEF6E7',
    accentBorder: '#FBD08A',
    accentRingRgba: 'rgba(217,119,6,0.07)',
    onAccent: '#FFFFFF',
    iconRestBg: '#FAFAF7',
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
    border2: '#3D404A',
    accent: '#F5B14E',
    accentBg: 'rgba(245,177,78,0.12)',
    accentBorder: 'rgba(245,177,78,0.4)',
    accentRingRgba: 'rgba(245,177,78,0.10)',
    onAccent: '#15161A',
    iconRestBg: '#262830',
  },
} as const;

type ThemeName = keyof typeof THEMES;
type Theme = (typeof THEMES)[ThemeName];

const FONT_DISPLAY = 'PlusJakartaSans_700Bold';
const FONT_BODY = 'Inter_400Regular';
const FONT_BODY_MEDIUM = 'Inter_500Medium';
const FONT_BODY_SEMI = 'Inter_600SemiBold';
const FONT_BODY_BOLD = 'Inter_700Bold';

// ---------------------------------------------------------------------------
// Survey options — coupled to the 6 known icon ids
// ---------------------------------------------------------------------------

export type SurveyOptionId =
  | 'physical'
  | 'mental'
  | 'productivity'
  | 'social'
  | 'finances'
  | 'growth';

export interface SurveyOption {
  id: SurveyOptionId;
  label: string;
  desc: string;
}

const DEFAULT_OPTIONS: SurveyOption[] = [
  { id: 'physical', label: 'Physical health', desc: 'Movement, sleep, energy' },
  { id: 'mental', label: 'Mental health', desc: 'Calm, focus, stress' },
  { id: 'productivity', label: 'Productivity', desc: 'Get things done' },
  { id: 'social', label: 'Social life', desc: 'Relationships, connection' },
  { id: 'finances', label: 'Finances', desc: 'Money habits' },
  { id: 'growth', label: 'Personal growth', desc: 'Curiosity, learning' },
];

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

interface SurveyIconProps {
  id: SurveyOptionId;
  color: string;
  size?: number;
  sw?: number;
}

const SurveyIcon = ({ id, color, size = 22, sw = 1.7 }: SurveyIconProps): JSX.Element => {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none' as const,
    stroke: color,
    strokeWidth: sw,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (id) {
    case 'physical':
      return (
        <Svg {...common}>
          <Path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" />
        </Svg>
      );
    case 'mental':
      return (
        <Svg {...common}>
          <Path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
          <Path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
        </Svg>
      );
    case 'productivity':
      return (
        <Svg {...common}>
          <Circle cx={12} cy={12} r={9} />
          <Circle cx={12} cy={12} r={5} />
          <Circle cx={12} cy={12} r={1.5} fill={color} />
        </Svg>
      );
    case 'social':
      return (
        <Svg {...common}>
          <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <Circle cx={9} cy={7} r={4} />
          <Path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <Path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </Svg>
      );
    case 'finances':
      return (
        <Svg {...common}>
          <Rect x={3} y={6} width={18} height={13} rx={2} />
          <Path d="M3 10h18" />
          <Circle cx={16} cy={14.5} r={1.2} fill={color} />
        </Svg>
      );
    case 'growth':
      return (
        <Svg {...common}>
          <Path d="M12 22V8" />
          <Path d="M5 12c0-3 3-6 7-6s7 3 7 6" />
          <Path d="M9 22h6" />
          <Path d="M12 8c-2-2-2-4 0-6 2 2 2 4 0 6Z" />
        </Svg>
      );
  }
};

interface ChevronLeftIconProps {
  size?: number;
  color: string;
  sw?: number;
}

const ChevronLeftIcon = ({ size = 22, color, sw = 1.8 }: ChevronLeftIconProps): JSX.Element => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <Path d="m15 18-6-6 6-6" />
  </Svg>
);

interface CheckIconProps {
  size?: number;
  color: string;
  sw?: number;
}

const CheckIcon = ({ size = 13, color, sw = 3 }: CheckIconProps): JSX.Element => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 6 9 17l-5-5" />
  </Svg>
);

interface ArrowRightIconProps {
  size?: number;
  color: string;
  sw?: number;
}

const ArrowRightIcon = ({ size = 16, color, sw = 2.5 }: ArrowRightIconProps): JSX.Element => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M5 12h14M13 5l7 7-7 7" />
  </Svg>
);

// ---------------------------------------------------------------------------
// Atoms
// ---------------------------------------------------------------------------

interface ProgressBarProps {
  fraction: number; // 0..1
  t: Theme;
}

// Animated fill — driven by `fraction`. When the parent advances the step,
// the bar animates 320ms instead of snapping.
const ProgressBar = ({ fraction, t }: ProgressBarProps): JSX.Element => {
  const anim = useRef(new Animated.Value(fraction)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: fraction,
      duration: 320,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: false, // width interpolation requires layout-thread
    }).start();
  }, [anim, fraction]);

  const widthPct = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View
      style={{
        flex: 1,
        height: 6,
        borderRadius: 99,
        backgroundColor: t.border,
        overflow: 'hidden',
      }}
    >
      <Animated.View
        style={{
          width: widthPct,
          height: '100%',
          backgroundColor: t.accent,
          borderRadius: 99,
        }}
      />
    </View>
  );
};

interface SurveyOptionRowProps {
  option: SurveyOption;
  selected: boolean;
  onToggle: (id: SurveyOptionId) => void;
  t: Theme;
}

const SurveyOptionRow = ({ option, selected, onToggle, t }: SurveyOptionRowProps): JSX.Element => {
  const iconStrokeColor = selected ? t.accent : t.fg2;

  return (
    <View>
      {/* 4px outer accent ring for the selected state — absolutely positioned
          so it paints outside the option's layout box and doesn't shift the row. */}
      {selected && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: -4,
            left: -4,
            right: -4,
            bottom: -4,
            borderRadius: 18,
            backgroundColor: t.accentRingRgba,
          }}
        />
      )}
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: selected }}
        accessibilityLabel={`${option.label}. ${option.desc}`}
        onPress={(): void => onToggle(option.id)}
        style={({ pressed }): ViewStyle => ({
          width: '100%',
          backgroundColor: selected ? t.accentBg : t.surface,
          borderWidth: 1.5,
          borderColor: selected ? t.accent : t.border,
          borderRadius: 14,
          paddingVertical: 14,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          opacity: pressed ? 0.9 : 1,
        })}
      >
        {/* Icon container */}
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            backgroundColor: selected ? t.surface : t.iconRestBg,
            borderWidth: 1,
            borderColor: selected ? t.accentBorder : t.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <SurveyIcon id={option.id} color={iconStrokeColor} />
        </View>

        {/* Label + description */}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: '600',
              color: t.fg1,
              lineHeight: 19,
              letterSpacing: -0.15,
              fontFamily: FONT_BODY_SEMI,
            }}
            numberOfLines={1}
          >
            {option.label}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: t.fg3,
              marginTop: 2,
              fontWeight: '400',
              fontFamily: FONT_BODY,
            }}
          >
            {option.desc}
          </Text>
        </View>

        {/* Checkbox */}
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 7,
            backgroundColor: selected ? t.accent : 'transparent',
            borderWidth: 1.5,
            borderColor: selected ? t.accent : t.border2,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {selected && <CheckIcon size={13} color={t.onAccent} sw={3} />}
        </View>
      </Pressable>
    </View>
  );
};

// ---------------------------------------------------------------------------
// SurveyScreen
// ---------------------------------------------------------------------------

export interface SurveyScreenProps {
  theme: ThemeName;
  step?: number;
  total?: number;
  options?: SurveyOption[];
  initialSelected?: SurveyOptionId[];
  onBack?: () => void;
  onContinue?: (selected: SurveyOptionId[]) => void;
}

export default function SurveyScreen({
  theme,
  step = 2,
  total = 5,
  options = DEFAULT_OPTIONS,
  initialSelected = ['physical', 'mental'],
  onBack,
  onContinue,
}: SurveyScreenProps): JSX.Element {
  const t: Theme = theme === 'dark' ? THEMES.dark : THEMES.light;
  const [selected, setSelected] = useState<SurveyOptionId[]>(initialSelected);

  const toggle = (id: SurveyOptionId): void => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const canContinue = selected.length > 0;
  const fraction = total > 0 ? step / total : 0;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      {/* Top bar: back arrow + progress bar + step counter */}
      <View style={{ paddingTop: 60, paddingHorizontal: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={onBack}
            hitSlop={12}
            style={{ padding: 4 }}
          >
            <ChevronLeftIcon color={t.fg2} />
          </Pressable>
          <ProgressBar fraction={fraction} t={t} />
          <Text
            style={{
              fontSize: 12,
              fontWeight: '600',
              color: t.fg3,
              fontVariant: ['tabular-nums'],
              fontFamily: FONT_BODY_SEMI,
            }}
          >
            {step} / {total}
          </Text>
        </View>
      </View>

      {/* Question */}
      <View style={{ paddingTop: 28, paddingHorizontal: 24, paddingBottom: 12 }}>
        <Text
          style={{
            fontSize: 11,
            color: t.accent,
            fontWeight: '700',
            letterSpacing: 0.88,
            textTransform: 'uppercase',
            marginBottom: 8,
            fontFamily: FONT_BODY_BOLD,
          }}
        >
          Step {step} · Focus areas
        </Text>
        <Text
          accessibilityRole="header"
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 26,
            fontWeight: '700',
            color: t.fg1,
            marginBottom: 8,
            letterSpacing: -0.65,
            lineHeight: 30,
          }}
        >
          What do you want to improve?
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: t.fg2,
            lineHeight: 21,
            fontWeight: '400',
            fontFamily: FONT_BODY,
          }}
        >
          Pick all that apply. We'll tune your daily challenges around these.
        </Text>
      </View>

      {/* Options list — scrollable */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 8, paddingHorizontal: 20, paddingBottom: 20, gap: 10 }}
        showsVerticalScrollIndicator={false}
      >
        {options.map((opt) => (
          <SurveyOptionRow
            key={opt.id}
            option={opt}
            selected={selected.includes(opt.id)}
            onToggle={toggle}
            t={t}
          />
        ))}
      </ScrollView>

      {/* Bottom CTA */}
      <View
        style={{
          paddingTop: 14,
          paddingHorizontal: 20,
          paddingBottom: 40,
          borderTopWidth: 1,
          borderTopColor: t.border,
          backgroundColor: t.bg,
        }}
      >
        <Text
          style={{
            fontSize: 12,
            color: t.fg3,
            fontWeight: '500',
            textAlign: 'center',
            marginBottom: 10,
            fontFamily: FONT_BODY_MEDIUM,
          }}
        >
          {selected.length === 0
            ? 'Select at least one to continue'
            : `${selected.length} selected · You can change this later`}
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !canContinue }}
          disabled={!canContinue}
          onPress={canContinue ? (): void => onContinue?.(selected) : undefined}
          style={({ pressed }): ViewStyle => ({
            width: '100%',
            paddingVertical: 16,
            paddingHorizontal: 24,
            borderRadius: 14,
            backgroundColor: canContinue ? t.accent : t.surface2,
            borderWidth: canContinue ? 0 : 1,
            borderColor: canContinue ? 'transparent' : t.border,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transform: [{ scale: pressed && canContinue ? 0.985 : 1 }],
            opacity: pressed && canContinue ? 0.94 : 1,
          })}
        >
          <Text
            style={{
              color: canContinue ? t.onAccent : t.fg4,
              fontFamily: FONT_BODY_SEMI,
              fontSize: 16,
              fontWeight: '600',
              letterSpacing: -0.08,
            }}
          >
            Continue
          </Text>
          {canContinue && <ArrowRightIcon size={16} color={t.onAccent} />}
        </Pressable>
      </View>
    </View>
  );
}
