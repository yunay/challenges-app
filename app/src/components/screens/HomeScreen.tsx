// Daily Challenges — Home screen (React Native port of handoff/home-screen.jsx).
// Default → Completed state transition with the celebratory streak spring.
//
// Requires: react-native-svg (install via `npx expo install react-native-svg`).

import {
  cloneElement,
  useEffect,
  useMemo,
  useRef,
  useState,
  type JSX,
  type ReactElement,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import Svg, { Circle, Path, Polyline, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

// ---------------------------------------------------------------------------
// Theme tokens (mirror handoff/home-screen.jsx exactly)
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
    catHealth: '#B5523F',
    catHealthBg: 'rgba(181,82,63,0.12)',
    catMental: '#7E6FA8',
    catMentalBg: 'rgba(126,111,168,0.12)',
    tabBg: 'rgba(255,255,255,0.92)',
    onAccent: '#FFFFFF',
    shadowColor: '#0F1E19',
    shadowOpacity: 0.06,
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
    catHealth: '#E07863',
    catHealthBg: 'rgba(224,120,99,0.16)',
    catMental: '#A89BD0',
    catMentalBg: 'rgba(168,155,208,0.16)',
    tabBg: 'rgba(30,31,36,0.92)',
    onAccent: '#15161A',
    shadowColor: '#000000',
    shadowOpacity: 0.25,
  },
} as const;

type ThemeName = keyof typeof THEMES;
type Theme = (typeof THEMES)[ThemeName];

const FONT_DISPLAY = 'PlusJakartaSans_700Bold';
const FONT_BODY = 'Inter_400Regular';
const FONT_BODY_MEDIUM = 'Inter_500Medium';
const FONT_BODY_SEMI = 'Inter_600SemiBold';

// ---------------------------------------------------------------------------
// Lucide-style icons (1.5px stroke by default), ported via react-native-svg
// ---------------------------------------------------------------------------

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

const FlameIcon = ({ size = 18, color = 'currentColor', sw = 2 }: IconProps): JSX.Element => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </Svg>
);

const HeartIcon = ({ size = 14, color = 'currentColor', sw = 1.8 }: IconProps): JSX.Element => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" />
  </Svg>
);

const BrainIcon = ({ size = 14, color = 'currentColor', sw = 1.8 }: IconProps): JSX.Element => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
    <Path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
  </Svg>
);

const ClockIcon = ({ size = 14, color = 'currentColor', sw = 1.8 }: IconProps): JSX.Element => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx={12} cy={12} r={10} />
    <Polyline points="12 6 12 12 16 14" />
  </Svg>
);

const SparkleIcon = ({ size = 14, color = 'currentColor', sw = 1.8 }: IconProps): JSX.Element => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
  </Svg>
);

const CheckIcon = ({ size = 18, color = 'currentColor', sw = 2.5 }: IconProps): JSX.Element => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 6 9 17l-5-5" />
  </Svg>
);

const ThumbsUpIcon = ({ size = 18, color = 'currentColor', sw = 1.5 }: IconProps): JSX.Element => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M7 10v12" />
    <Path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H7" />
  </Svg>
);

const ThumbsDownIcon = ({ size = 18, color = 'currentColor', sw = 1.5 }: IconProps): JSX.Element => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M17 14V2" />
    <Path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20" />
  </Svg>
);

// Lucide "ban" — circle with a diagonal slash. Used for the not_applicable
// feedback chip ("doesn't apply to me").
const BanIcon = ({ size = 18, color = 'currentColor', sw = 1.5 }: IconProps): JSX.Element => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx={12} cy={12} r={10} />
    <Path d="m4.93 4.93 14.14 14.14" />
  </Svg>
);

// ---------------------------------------------------------------------------
// Reusable atoms
// ---------------------------------------------------------------------------

interface StreakPillProps {
  count: number;
  t: Theme;
}

const StreakPill = ({ count, t }: StreakPillProps): JSX.Element => {
  const { t: translate } = useTranslation();
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 8,
        paddingLeft: 12,
        paddingRight: 16,
        borderRadius: 9999,
        backgroundColor: t.accentBg,
        borderWidth: 1,
        borderColor: t.accentBorder,
      }}
    >
      <FlameIcon size={18} color={t.accent} />
      <Text
        style={{
          fontFamily: FONT_BODY_SEMI,
          fontSize: 14,
          color: t.accent,
          fontWeight: '700',
          fontVariant: ['tabular-nums'],
          letterSpacing: -0.14,
        }}
      >
        {translate('home.streak_count', { count })}
      </Text>
      <Text
        style={{
          fontFamily: FONT_BODY_MEDIUM,
          fontSize: 12,
          color: t.accent,
          fontWeight: '500',
          letterSpacing: -0.12,
        }}
      >
        {translate('home.streak_label')}
      </Text>
    </View>
  );
};

interface CategoryBadgeProps {
  icon: JSX.Element;
  label: string;
  color: string;
  bg: string;
}

const CategoryBadge = ({ icon, label, color, bg }: CategoryBadgeProps): JSX.Element => (
  <View
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      backgroundColor: bg,
    }}
  >
    {icon}
    <Text
      style={{
        color,
        fontSize: 12,
        fontWeight: '600',
        fontFamily: FONT_BODY_SEMI,
        letterSpacing: 0.12,
      }}
    >
      {label}
    </Text>
  </View>
);

interface MetaPillProps {
  icon: JSX.Element;
  children: string;
  t: Theme;
}

const MetaPill = ({ icon, children, t }: MetaPillProps): JSX.Element => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
    {icon}
    <Text
      style={{
        fontSize: 13,
        color: t.fg2,
        fontFamily: FONT_BODY_MEDIUM,
        fontWeight: '500',
      }}
    >
      {children}
    </Text>
  </View>
);

interface EyebrowProps {
  children: string;
  t: Theme;
  accent?: boolean;
}

const Eyebrow = ({ children, t, accent = false }: EyebrowProps): JSX.Element => (
  <Text
    style={{
      fontSize: 11,
      fontWeight: '600',
      color: accent ? t.accent : t.fg3,
      letterSpacing: 0.88,
      textTransform: 'uppercase',
      fontFamily: FONT_BODY_SEMI,
    }}
  >
    {children}
  </Text>
);

interface PrimaryButtonProps {
  children: string;
  onPress: () => void;
  t: Theme;
}

const PrimaryButton = ({ children, onPress, t }: PrimaryButtonProps): JSX.Element => (
  <Pressable
    accessibilityRole="button"
    onPress={onPress}
    style={({ pressed }) => ({
      width: '100%',
      paddingVertical: 15,
      paddingHorizontal: 20,
      backgroundColor: t.accent,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      transform: [{ scale: pressed ? 0.98 : 1 }],
      opacity: pressed ? 0.94 : 1,
    })}
  >
    <Text
      style={{
        color: t.onAccent,
        fontFamily: FONT_BODY_SEMI,
        fontSize: 15,
        fontWeight: '600',
        letterSpacing: -0.075,
      }}
    >
      {children}
    </Text>
  </Pressable>
);

// Category icon + color mapping. Health/mental have dedicated theme tokens;
// productivity/social/finance reuse existing palette so no new design surfaces.
type Category = 'health' | 'mental' | 'productivity' | 'social' | 'finance';

function categoryColors(category: Category, t: Theme): { color: string; bg: string } {
  switch (category) {
    case 'health':
    case 'social':
      return { color: t.catHealth, bg: t.catHealthBg };
    case 'mental':
    case 'finance':
      return { color: t.catMental, bg: t.catMentalBg };
    case 'productivity':
      return { color: t.accent, bg: t.accentBg };
  }
}

function categoryIcon(category: Category, color: string, size: number): JSX.Element {
  switch (category) {
    case 'health':
    case 'social':
      return <HeartIcon size={size} color={color} />;
    case 'mental':
    case 'finance':
      return <BrainIcon size={size} color={color} />;
    case 'productivity':
      return <SparkleIcon size={size} color={color} sw={2} />;
  }
}

interface FeedbackButtonProps {
  label: string;
  icon: ReactElement<IconProps>;
  selected: boolean;
  onPress: () => void;
  t: Theme;
}

const FeedbackButton = ({ label, icon, selected, onPress, t }: FeedbackButtonProps): JSX.Element => (
  <Pressable
    accessibilityRole="button"
    accessibilityState={{ selected }}
    onPress={onPress}
    style={{
      flex: 1,
      alignItems: 'center',
      gap: 6,
      paddingVertical: 12,
      paddingHorizontal: 6,
      backgroundColor: selected ? t.accentBg : 'transparent',
      borderWidth: 1,
      borderColor: selected ? t.accent : t.border,
      borderRadius: 10,
    }}
  >
    {cloneElement(icon, { color: selected ? t.accent : t.fg2 })}
    <Text
      style={{
        fontFamily: FONT_BODY_MEDIUM,
        fontSize: 12,
        fontWeight: '500',
        color: selected ? t.accent : t.fg1,
      }}
    >
      {label}
    </Text>
  </Pressable>
);

// ---------------------------------------------------------------------------
// Completed (celebratory) card — replaces main card after Mark as done
// ---------------------------------------------------------------------------

type FeedbackId = 'easy' | 'great' | 'too_hard' | 'not_applicable';

interface CompletedCardProps {
  streak: number;
  points: number;
  feedback: FeedbackId | null;
  setFeedback: (id: FeedbackId) => void;
  // Non-null when the most recent persistence attempt failed; renders below
  // the buttons so the user can retry by tapping again.
  feedbackError: string | null;
  t: Theme;
}

const CompletedCard = ({ streak, points, feedback, setFeedback, feedbackError, t }: CompletedCardProps): JSX.Element => {
  const { t: translate } = useTranslation();
  // Three coordinated entrance animations:
  //   cardIn      — 320ms fade + 6px translateY  (Material standard)
  //   medallionIn — 360ms scale 0.6 → 1.06 → 1   (overshoot for delight)
  //   streakSpring — 520ms scale spring          (the one allowed bouncy moment)
  const cardAnim = useRef(new Animated.Value(0)).current;
  const medallionAnim = useRef(new Animated.Value(0)).current;
  const streakAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardAnim, {
        toValue: 1,
        duration: 320,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
      }),
      Animated.timing(medallionAnim, {
        toValue: 1,
        duration: 360,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
      }),
      Animated.timing(streakAnim, {
        toValue: 1,
        duration: 520,
        easing: Easing.bezier(0.34, 1.56, 0.64, 1),
        useNativeDriver: true,
      }),
    ]).start();
  }, [cardAnim, medallionAnim, streakAnim]);

  const cardOpacity = cardAnim;
  const cardTranslateY = cardAnim.interpolate({ inputRange: [0, 1], outputRange: [6, 0] });
  const medallionScale = medallionAnim.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0.6, 1.06, 1],
  });
  const streakScale = streakAnim.interpolate({
    inputRange: [0, 0.25, 0.55, 0.8, 1],
    outputRange: [1, 1.18, 0.96, 1.04, 1],
  });

  return (
    <Animated.View
      style={{
        backgroundColor: t.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: t.accentBorder,
        paddingTop: 24,
        paddingHorizontal: 20,
        paddingBottom: 18,
        overflow: 'hidden',
        opacity: cardOpacity,
        transform: [{ translateY: cardTranslateY }],
        ...shadow(t),
      }}
    >
      {/* Soft amber wash at the top — RN approximation of the radial gradient. */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 140,
          backgroundColor: t.accentBg,
          opacity: 0.6,
        }}
      />

      {/* Check medallion */}
      <Animated.View
        style={{
          width: 56,
          height: 56,
          marginBottom: 14,
          alignSelf: 'center',
          borderRadius: 9999,
          backgroundColor: t.accent,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ scale: medallionScale }],
        }}
      >
        <CheckIcon size={28} color={t.onAccent} sw={2.8} />
      </Animated.View>

      {/* Headline */}
      <Text
        style={{
          fontFamily: FONT_DISPLAY,
          fontSize: 22,
          fontWeight: '700',
          color: t.fg1,
          textAlign: 'center',
          marginBottom: 4,
          letterSpacing: -0.44,
          lineHeight: 26,
        }}
      >
        {translate('home.completed_headline')}
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: t.fg2,
          marginBottom: 18,
          fontFamily: FONT_BODY,
          lineHeight: 21,
          textAlign: 'center',
        }}
      >
        {translate('home.completed_subline', { count: streak })}
      </Text>

      {/* Stats row: points + streak, divided by a 1px hairline */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingTop: 14,
          paddingBottom: 4,
        }}
      >
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 28,
              fontWeight: '700',
              color: t.accent,
              fontVariant: ['tabular-nums'],
              letterSpacing: -0.56,
              lineHeight: 28,
            }}
          >
            +{points}
          </Text>
          <Text
            style={{
              fontSize: 11,
              color: t.fg3,
              fontWeight: '600',
              letterSpacing: 0.88,
              textTransform: 'uppercase',
              marginTop: 6,
              fontFamily: FONT_BODY_SEMI,
            }}
          >
            {translate('home.points_earned')}
          </Text>
        </View>

        <View style={{ width: 1, height: 36, backgroundColor: t.border }} />

        <View style={{ flex: 1, alignItems: 'center' }}>
          <Animated.View
            style={{
              flexDirection: 'row',
              alignItems: 'baseline',
              gap: 4,
              transform: [{ scale: streakScale }],
            }}
          >
            <FlameIcon size={20} color={t.accent} sw={2.2} />
            <Text
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: 28,
                fontWeight: '700',
                color: t.accent,
                fontVariant: ['tabular-nums'],
                letterSpacing: -0.56,
                lineHeight: 28,
              }}
            >
              {streak}
            </Text>
          </Animated.View>
          <Text
            style={{
              fontSize: 11,
              color: t.fg3,
              fontWeight: '600',
              letterSpacing: 0.88,
              textTransform: 'uppercase',
              marginTop: 6,
              fontFamily: FONT_BODY_SEMI,
            }}
          >
            {translate('home.day_streak_label')}
          </Text>
        </View>
      </View>

      {/* Feedback */}
      <View
        style={{
          marginTop: 20,
          paddingTop: 16,
          borderTopWidth: 1,
          borderTopColor: t.border,
        }}
      >
        <Text
          style={{
            fontSize: 13,
            color: t.fg2,
            fontWeight: '500',
            marginBottom: 10,
            fontFamily: FONT_BODY_MEDIUM,
            textAlign: 'center',
          }}
        >
          {translate('home.feedback_question')}
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <FeedbackButton
            label={translate('home.feedback.easy')}
            icon={<ThumbsUpIcon />}
            selected={feedback === 'easy'}
            onPress={(): void => setFeedback('easy')}
            t={t}
          />
          <FeedbackButton
            label={translate('home.feedback.great')}
            icon={<CheckIcon size={18} sw={2} />}
            selected={feedback === 'great'}
            onPress={(): void => setFeedback('great')}
            t={t}
          />
          <FeedbackButton
            label={translate('home.feedback.too_hard')}
            icon={<ThumbsDownIcon />}
            selected={feedback === 'too_hard'}
            onPress={(): void => setFeedback('too_hard')}
            t={t}
          />
          <FeedbackButton
            label={translate('home.feedback.not_applicable')}
            icon={<BanIcon />}
            selected={feedback === 'not_applicable'}
            onPress={(): void => setFeedback('not_applicable')}
            t={t}
          />
        </View>
        {feedbackError ? (
          <Text
            style={{
              marginTop: 8,
              fontSize: 12,
              color: '#DC2626',
              fontFamily: FONT_BODY_MEDIUM,
              fontWeight: '500',
              textAlign: 'center',
            }}
          >
            {feedbackError}
          </Text>
        ) : null}
      </View>
    </Animated.View>
  );
};

// ---------------------------------------------------------------------------
// Pre-generation hero — "Challenge me!" call-to-action
// ---------------------------------------------------------------------------

interface ChallengeMeHeroProps {
  t: Theme;
  disabled: boolean;
  onPress: () => void;
}

const ChallengeMeHero = ({ t, disabled, onPress }: ChallengeMeHeroProps): JSX.Element => {
  const { t: translate } = useTranslation();
  return (
    <View
      style={{
        backgroundColor: t.surface,
        borderRadius: 16,
        paddingVertical: 36,
        paddingHorizontal: 24,
        alignItems: 'center',
        gap: 18,
        borderWidth: 1,
        borderColor: t.border,
        ...shadow(t),
      }}
    >
      <Text
        style={{
          fontFamily: FONT_DISPLAY,
          fontSize: 22,
          fontWeight: '700',
          color: t.fg1,
          textAlign: 'center',
          letterSpacing: -0.44,
          lineHeight: 28,
        }}
      >
        {translate('home.challenge_me_hook')}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => ({
          paddingVertical: 16,
          paddingHorizontal: 28,
          backgroundColor: t.accent,
          borderRadius: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          opacity: disabled ? 0.6 : pressed ? 0.94 : 1,
          transform: [{ scale: pressed && !disabled ? 0.98 : 1 }],
        })}
      >
        <SparkleIcon size={18} color={t.onAccent} sw={2.2} />
        <Text
          style={{
            color: t.onAccent,
            fontFamily: FONT_BODY_SEMI,
            fontSize: 16,
            fontWeight: '700',
            letterSpacing: -0.16,
          }}
        >
          {translate('home.challenge_me_button')}
        </Text>
      </Pressable>
      <Text
        style={{
          fontSize: 13,
          color: t.fg3,
          textAlign: 'center',
          fontFamily: FONT_BODY,
          lineHeight: 19,
        }}
      >
        {translate('home.challenge_me_subline')}
      </Text>
    </View>
  );
};

// ---------------------------------------------------------------------------
// Skeleton — placeholder while the Edge Function is in flight
// ---------------------------------------------------------------------------

interface SkeletonCardProps {
  t: Theme;
  // undefined → default "Generating something special…" (the generation flow).
  // null → no caption (used for the cold-start loading shell, where the user
  // isn't generating, just waiting on the initial fetch).
  caption?: string | null;
}

const SkeletonCard = ({ t, caption }: SkeletonCardProps): JSX.Element => {
  const { t: translate } = useTranslation();
  const captionText = caption === undefined ? translate('home.generation.loading') : caption;
  // Looped 0↔1 pulse driving the placeholder bars' opacity. Stops cleanly on
  // unmount so the card can be replaced with the revealed challenge.
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 750, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return (): void => loop.stop();
  }, [pulse]);
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.85] });

  const Bar = ({ width, height = 14, mb = 10 }: { width: number | string; height?: number; mb?: number }): JSX.Element => (
    <Animated.View
      style={{
        width: width as ViewStyle['width'],
        height,
        borderRadius: 6,
        backgroundColor: t.surface2,
        marginBottom: mb,
        opacity,
      }}
    />
  );

  return (
    <View
      style={{
        backgroundColor: t.surface,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: t.border,
        ...shadow(t),
      }}
    >
      {/* Category badge placeholder */}
      <Animated.View
        style={{
          width: 72,
          height: 24,
          borderRadius: 8,
          backgroundColor: t.surface2,
          marginBottom: 16,
          opacity,
        }}
      />
      {/* Title placeholder — two lines */}
      <Bar width="92%" height={20} />
      <Bar width="68%" height={20} mb={16} />
      {/* Description placeholder — three lines */}
      <Bar width="100%" />
      <Bar width="96%" />
      <Bar width="74%" mb={18} />
      {/* Footer line */}
      {captionText ? (
        <Text
          style={{
            fontSize: 13,
            color: t.fg3,
            fontFamily: FONT_BODY_MEDIUM,
            fontWeight: '500',
            textAlign: 'center',
          }}
        >
          {captionText}
        </Text>
      ) : null}
    </View>
  );
};

// ---------------------------------------------------------------------------
// Generation error — friendly copy + retry
// ---------------------------------------------------------------------------

interface GenerationErrorCardProps {
  t: Theme;
  error: 'offline' | 'generic';
  onRetry: () => void;
  disabled: boolean;
}

const GenerationErrorCard = ({ t, error, onRetry, disabled }: GenerationErrorCardProps): JSX.Element => {
  const { t: translate } = useTranslation();
  const message = translate(
    error === 'offline'
      ? 'home.generation.error_offline'
      : 'home.generation.error_generic',
  );
  return (
    <View
      style={{
        backgroundColor: t.surface,
        borderRadius: 16,
        paddingVertical: 28,
        paddingHorizontal: 22,
        alignItems: 'center',
        gap: 16,
        borderWidth: 1,
        borderColor: t.border,
        ...shadow(t),
      }}
    >
      <Text
        style={{
          fontSize: 14,
          color: t.fg2,
          fontFamily: FONT_BODY,
          textAlign: 'center',
          lineHeight: 20,
        }}
      >
        {message}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onRetry}
        style={({ pressed }) => ({
          paddingVertical: 12,
          paddingHorizontal: 22,
          backgroundColor: t.accent,
          borderRadius: 10,
          opacity: disabled ? 0.6 : pressed ? 0.94 : 1,
          transform: [{ scale: pressed && !disabled ? 0.98 : 1 }],
        })}
      >
        <Text
          style={{
            color: t.onAccent,
            fontFamily: FONT_BODY_SEMI,
            fontSize: 14,
            fontWeight: '600',
            letterSpacing: -0.07,
          }}
        >
          {translate('home.generation.retry')}
        </Text>
      </Pressable>
    </View>
  );
};

// ---------------------------------------------------------------------------
// HomeScreen
// ---------------------------------------------------------------------------

export type TabId = 'home' | 'history' | 'profile';

type Difficulty = 'easy' | 'medium' | 'hard';
type Status = 'pending' | 'done' | 'skipped';

export interface HomeChallenge {
  id: string;
  title: string;
  description: string;
  category: Category;
  difficulty: Difficulty;
  duration_min: number;
  points: number;
  status: Status;
  // Persisted feedback. Same enum as the DB's challenges.feedback column
  // (one source of truth — no UI/DB divergence to map between).
  feedback?: FeedbackId | null;
}

export interface HomeScreenProps {
  name: string;
  streak: number;
  theme: ThemeName;
  active?: TabId;
  onTab?: (id: TabId) => void;
  // Fired the first time the user taps "Mark as done". Side-effects only —
  // the visual completed state is still driven by internal `done` state.
  onMarkDone?: () => void;
  // Fired when the user picks a feedback chip on the completed card. Returns
  // a Promise so HomeScreen can roll back the optimistic state on DB failure.
  onFeedback?: (id: FeedbackId) => Promise<{ error: string | null }>;
  // Today's main challenge. Null/undefined → render the pre-generation hero
  // ("Challenge me!" button) unless `generating` or `generationError` is set.
  mainChallenge?: HomeChallenge | null;
  // False until the first fetchToday() resolves. While false, render a quiet
  // loading shell instead of the Challenge me! hero — `mainChallenge === null`
  // alone can't disambiguate "haven't checked yet" from "no challenge today".
  initialFetchComplete?: boolean;
  // Edge Function call in flight — render the skeleton placeholder.
  generating?: boolean;
  // Last generation outcome. null = no error or recovered. The retry button
  // re-runs `onGenerate`.
  generationError?: 'offline' | 'generic' | null;
  // Tapped "Challenge me!" or the retry button.
  onGenerate?: () => void;
}

export default function HomeScreen({
  name,
  streak,
  theme,
  active = 'home',
  onTab,
  onMarkDone,
  onFeedback,
  mainChallenge,
  initialFetchComplete = false,
  generating = false,
  generationError = null,
  onGenerate,
}: HomeScreenProps): JSX.Element {
  const t: Theme = theme === 'dark' ? THEMES.dark : THEMES.light;
  const { t: translate, i18n } = useTranslation();

  // Optimistic flag covers the gap between user tap and the next fetchToday
  // returning the row with status='done'. Persistent completion is driven by
  // the row's status — so a cold start where status is already 'done' renders
  // the completed card immediately, with no transition through the active state.
  const [optimisticDone, setOptimisticDone] = useState(false);
  // Optimistic feedback mirrors the same pattern: tap → flip immediately;
  // hydrate from the persisted row on cold start; reset on day rollover. null
  // means "no optimistic override active — defer to mainChallenge.feedback".
  const [optimisticFeedback, setOptimisticFeedback] = useState<FeedbackId | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const persistedDone = mainChallenge?.status === 'done';
  const done = optimisticDone || persistedDone;
  const displayFeedback: FeedbackId | null =
    optimisticFeedback ?? mainChallenge?.feedback ?? null;

  // Reset optimistic + feedback when the challenge id changes (day rollover).
  // Without this, a stale optimisticDone from yesterday would carry into
  // today's fresh main row and incorrectly show CompletedCard for it.
  useEffect(() => {
    setOptimisticDone(false);
    setOptimisticFeedback(null);
    setFeedbackError(null);
  }, [mainChallenge?.id]);

  // Staged reveal animation. Drives three opacity interpolations:
  //   category badge (0–33%), title (33–66%), description (66–100%).
  // We only animate when a new challenge appears mid-session (null → set).
  // On cold start where mainChallenge is already populated, snap to 1 to
  // avoid a phantom fade-in on every navigation back to Home.
  const revealAnim = useRef(new Animated.Value(mainChallenge ? 1 : 0)).current;
  const isFirstRender = useRef(true);
  const prevMainId = useRef<string | null>(mainChallenge?.id ?? null);
  useEffect(() => {
    const prev = prevMainId.current;
    const curr = mainChallenge?.id ?? null;
    if (isFirstRender.current) {
      revealAnim.setValue(curr ? 1 : 0);
      isFirstRender.current = false;
    } else if (prev === null && curr !== null) {
      // Fresh reveal: stage in over 600ms and fire the success haptic on
      // completion (medium-weight to mark the moment without being jarring).
      revealAnim.setValue(0);
      Animated.timing(revealAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      });
    } else {
      revealAnim.setValue(curr ? 1 : 0);
    }
    prevMainId.current = curr;
  }, [mainChallenge?.id, revealAnim]);

  // Tap handler shared by the hero "Challenge me!" button and the error-state
  // retry button. Disables itself while generating so a double-tap can't
  // double-invoke the Edge Function.
  const handleGenerate = (): void => {
    if (generating) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onGenerate?.();
  };

  // Wraps setOptimisticDone + setOptimisticFeedback so the existing call sites
  // stay one-liners while we also notify the route to persist.
  const handleMarkDone = (): void => {
    setOptimisticDone(true);
    onMarkDone?.();
  };
  const setFeedback = (id: FeedbackId): void => {
    // Capture the value the UI is showing right now so we can roll back to it
    // if the DB write fails. `displayFeedback` is the source of truth — it
    // already collapses optimistic + persisted into the visible value.
    const prev = displayFeedback;
    setOptimisticFeedback(id);
    setFeedbackError(null);
    void (async (): Promise<void> => {
      const result = await onFeedback?.(id);
      if (result?.error) {
        setOptimisticFeedback(prev);
        setFeedbackError(translate('home.feedback_save_error'));
      }
    })();
  };
  // Streak is kept as the persisted value — the trigger on challenges.update
  // bumps user_stats.current_streak, so a refetch picks up the new number.
  // Optimistic +1 was demo behavior that doesn't survive cold start either way.
  const displayStreak = streak;

  // Locale-aware date for the eyebrow. uppercase styling is applied by the
  // text style downstream; this just produces the cased base string.
  const locale = i18n.language === 'bg' ? 'bg-BG' : 'en-GB';
  const dateEyebrow = useMemo(
    () =>
      new Date().toLocaleDateString(locale, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }),
    [locale],
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 60, paddingHorizontal: 20, paddingBottom: 180 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting block */}
        <View style={{ marginBottom: 18 }}>
          <Text
            style={{
              fontSize: 12,
              color: t.fg3,
              fontWeight: '600',
              letterSpacing: 0.96,
              textTransform: 'uppercase',
              marginBottom: 6,
              fontFamily: FONT_BODY_SEMI,
            }}
          >
            {dateEyebrow}
          </Text>
          <Text
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 28,
              fontWeight: '700',
              color: t.fg1,
              letterSpacing: -0.7,
              lineHeight: 32,
            }}
          >
            {translate('home.greeting', { name })}
          </Text>
        </View>

        {/* Streak pill */}
        <View style={{ marginBottom: 24 }}>
          <StreakPill count={displayStreak} t={t} />
        </View>

        {/* Today's challenge */}
        <View style={{ marginBottom: 12 }}>
          <Eyebrow t={t}>{translate('home.main_challenge')}</Eyebrow>
        </View>

        {!initialFetchComplete && !mainChallenge && !generating ? (
          // Cold-start loading shell. Without this branch, mainChallenge=null
          // would render the Challenge me! hero before fetchToday resolves,
          // briefly flashing the button even when today already has a row.
          <View style={{ marginBottom: 24 }}>
            <SkeletonCard t={t} caption={null} />
          </View>
        ) : generating && !mainChallenge ? (
          <View style={{ marginBottom: 24 }}>
            <SkeletonCard t={t} />
          </View>
        ) : !mainChallenge && generationError ? (
          <View style={{ marginBottom: 24 }}>
            <GenerationErrorCard
              t={t}
              error={generationError}
              onRetry={handleGenerate}
              disabled={generating}
            />
          </View>
        ) : !mainChallenge ? (
          <View style={{ marginBottom: 24 }}>
            <ChallengeMeHero t={t} disabled={generating} onPress={handleGenerate} />
          </View>
        ) : done ? (
          <View style={{ marginBottom: 24 }}>
            <CompletedCard
              streak={displayStreak}
              points={mainChallenge.points}
              feedback={displayFeedback}
              setFeedback={setFeedback}
              feedbackError={feedbackError}
              t={t}
            />
          </View>
        ) : (
          (() => {
            const mainCats = categoryColors(mainChallenge.category, t);
            // Stagger windows on the shared revealAnim. Cold-start renders
            // collapse to revealAnim=1 so all three are fully opaque.
            const categoryOpacity = revealAnim.interpolate({
              inputRange: [0, 0.33],
              outputRange: [0, 1],
              extrapolate: 'clamp',
            });
            const titleOpacity = revealAnim.interpolate({
              inputRange: [0.33, 0.66],
              outputRange: [0, 1],
              extrapolate: 'clamp',
            });
            const descOpacity = revealAnim.interpolate({
              inputRange: [0.66, 1],
              outputRange: [0, 1],
              extrapolate: 'clamp',
            });
            return (
              <View
                style={{
                  backgroundColor: t.surface,
                  borderRadius: 16,
                  padding: 20,
                  marginBottom: 24,
                  ...shadow(t),
                }}
              >
                <Animated.View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 14,
                    opacity: categoryOpacity,
                  }}
                >
                  <CategoryBadge
                    icon={categoryIcon(mainChallenge.category, mainCats.color, 13)}
                    label={translate(`categories.${mainChallenge.category}`)}
                    color={mainCats.color}
                    bg={mainCats.bg}
                  />
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <SparkleIcon size={13} color={t.accent} sw={2} />
                    <Text
                      style={{
                        fontSize: 13,
                        color: t.accent,
                        fontWeight: '600',
                        fontFamily: FONT_BODY_SEMI,
                        fontVariant: ['tabular-nums'],
                      }}
                    >
                      +{mainChallenge.points} {translate('home.points_suffix')}
                    </Text>
                  </View>
                </Animated.View>

                <Animated.Text
                  style={{
                    fontFamily: FONT_DISPLAY,
                    fontSize: 22,
                    fontWeight: '700',
                    color: t.fg1,
                    lineHeight: 28,
                    marginBottom: 10,
                    letterSpacing: -0.44,
                    opacity: titleOpacity,
                  }}
                >
                  {mainChallenge.title}
                </Animated.Text>

                <Animated.Text
                  style={{
                    fontSize: 14,
                    color: t.fg2,
                    lineHeight: 21,
                    marginBottom: 18,
                    fontFamily: FONT_BODY,
                    fontWeight: '400',
                    opacity: descOpacity,
                  }}
                >
                  {mainChallenge.description}
                </Animated.Text>

                <Animated.View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 16,
                    marginBottom: 18,
                    opacity: descOpacity,
                  }}
                >
                  <MetaPill icon={<ClockIcon color={t.fg3} />} t={t}>
                    {translate('home.meta.minutes', { count: mainChallenge.duration_min })}
                  </MetaPill>
                  <View style={{ width: 3, height: 3, borderRadius: 99, backgroundColor: t.fg4 }} />
                  <MetaPill icon={<SparkleIcon color={t.fg3} />} t={t}>
                    {translate(`home.meta.${mainChallenge.difficulty}`)}
                  </MetaPill>
                </Animated.View>

                <Animated.View style={{ opacity: descOpacity }}>
                  <PrimaryButton onPress={handleMarkDone} t={t}>
                    {translate('home.mark_done')}
                  </PrimaryButton>
                </Animated.View>
              </View>
            );
          })()
        )}
      </ScrollView>

      {/* Tab bar */}
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
    </View>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// CSS box-shadow → RN shadow* + Android elevation. Mirrors the handoff's
// "0 1px 2px ...04, 0 4px 12px ...06" by leaning on the larger drop shadow.
function shadow(t: Theme): ViewStyle {
  return {
    shadowColor: t.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: t.shadowOpacity,
    shadowRadius: 12,
    elevation: 3,
  };
}

// Suppress unused style warnings if a future refactor moves to StyleSheet.
const _unusedStyleSheet = StyleSheet.create({});
void _unusedStyleSheet;
