// Daily Challenges — Welcome screen (React Native port of handoff/welcome-screen.jsx).
// First screen new users see: ambient amber glow, centered hero, bottom CTA stack.
//
// Requires: react-native-svg (install via `npx expo install react-native-svg`).

import { type JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';

import Mascot from '../Mascot';

// ---------------------------------------------------------------------------
// Theme tokens (mirror handoff exactly — Warm Amber on Stone neutrals)
// ---------------------------------------------------------------------------

const THEMES = {
  light: {
    bg: '#FAFAF7',
    fg1: '#18221E',
    fg2: '#4A574F',
    fg3: '#7C8881',
    accent: '#D97706',
    onAccent: '#FFFFFF',
    glow: 'rgba(217,119,6,0.10)',
    ctaShadow: 'rgba(217,119,6,0.22)',
  },
  dark: {
    bg: '#15161A',
    fg1: '#F2EFE6',
    fg2: '#C2BFB4',
    fg3: '#8A8576',
    accent: '#F5B14E',
    onAccent: '#15161A',
    glow: 'rgba(245,177,78,0.10)',
    ctaShadow: 'rgba(245,177,78,0.20)',
  },
} as const;

type ThemeName = keyof typeof THEMES;
type Theme = (typeof THEMES)[ThemeName];

const FONT_DISPLAY_BOLD = 'PlusJakartaSans_700Bold';
const FONT_DISPLAY_SEMI = 'PlusJakartaSans_600SemiBold';
const FONT_BODY = 'Inter_400Regular';
const FONT_BODY_MEDIUM = 'Inter_500Medium';
const FONT_BODY_SEMI = 'Inter_600SemiBold';

// ---------------------------------------------------------------------------
// Visual atoms
// ---------------------------------------------------------------------------

interface AmbientGlowProps {
  color: string;
  size?: number;
}

// Radial-gradient backdrop. CSS uses `radial-gradient(circle, color 0%, transparent 65%)`;
// we render the same with SVG <RadialGradient> for pixel-faithful falloff. Drawn via
// pointerEvents="none" so it doesn't intercept taps.
const AmbientGlow = ({ color, size = 460 }: AmbientGlowProps): JSX.Element => (
  <View
    pointerEvents="none"
    style={{
      position: 'absolute',
      top: -120,
      left: '50%',
      marginLeft: -size / 2,
      width: size,
      height: size,
    }}
  >
    <Svg width={size} height={size}>
      <Defs>
        <RadialGradient id="welcome-glow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <Stop offset="0%" stopColor={color} stopOpacity={1} />
          <Stop offset="65%" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={size / 2} cy={size / 2} r={size / 2} fill="url(#welcome-glow)" />
    </Svg>
  </View>
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
// WelcomeScreen
// ---------------------------------------------------------------------------

export interface WelcomeScreenProps {
  theme: ThemeName;
  onGetStarted?: () => void;
  onSignIn?: () => void;
}

export default function WelcomeScreen({
  theme,
  onGetStarted,
  onSignIn,
}: WelcomeScreenProps): JSX.Element {
  const t: Theme = theme === 'dark' ? THEMES.dark : THEMES.light;
  const { t: translate } = useTranslation();

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, overflow: 'hidden' }}>
      {/* Ambient amber radial glow — sets atmosphere, no illustration needed */}
      <AmbientGlow color={t.glow} />

      {/* Centered hero block: logo + wordmark + tagline + supporting line */}
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: 60,
          paddingHorizontal: 28,
          zIndex: 1,
        }}
      >
        <View style={{ marginBottom: 28, alignItems: 'center' }}>
          <Mascot variant="hero" size={180} state="idle" />
        </View>

        {/* Wordmark */}
        <Text
          accessibilityRole="header"
          style={{
            fontFamily: FONT_DISPLAY_BOLD,
            fontSize: 28,
            fontWeight: '700',
            color: t.fg1,
            marginBottom: 14,
            letterSpacing: -0.7,
            textAlign: 'center',
            lineHeight: 31,
          }}
        >
          {translate('welcome.wordmark')}
        </Text>

        {/* Tagline — accent-highlighted word renders inline via three-part split */}
        <Text
          style={{
            fontFamily: FONT_DISPLAY_SEMI,
            fontSize: 22,
            fontWeight: '600',
            color: t.fg1,
            letterSpacing: -0.44,
            lineHeight: 28,
            textAlign: 'center',
            maxWidth: 300,
          }}
        >
          {translate('welcome.tagline_prefix')}{' '}
          <Text style={{ color: t.accent }}>{translate('welcome.tagline_highlight')}</Text>{' '}
          {translate('welcome.tagline_suffix')}
        </Text>

        {/* Supporting line */}
        <Text
          style={{
            fontFamily: FONT_BODY,
            fontSize: 14,
            fontWeight: '400',
            color: t.fg2,
            marginTop: 14,
            lineHeight: 21,
            textAlign: 'center',
            maxWidth: 280,
          }}
        >
          {translate('welcome.supporting')}
        </Text>
      </View>

      {/* CTA block */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingBottom: 44,
          alignItems: 'center',
          gap: 18,
          zIndex: 1,
        }}
      >
        {/* Primary: Get started */}
        <Pressable
          accessibilityRole="button"
          onPress={onGetStarted}
          style={{
            width: '100%',
            paddingVertical: 17,
            paddingHorizontal: 24,
            backgroundColor: t.accent,
            borderRadius: 14,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            // Colored amber glow under the CTA — soft and wide
            shadowColor: t.ctaShadow,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 1,
            shadowRadius: 18,
            elevation: 6,
          }}
        >
          <Text
            style={{
              color: t.onAccent,
              fontFamily: FONT_BODY_SEMI,
              fontSize: 16,
              fontWeight: '600',
              letterSpacing: -0.08,
            }}
          >
            {translate('welcome.cta_get_started')}
          </Text>
          <ArrowRightIcon size={16} color={t.onAccent} />
        </Pressable>

        {/* Secondary: I already have an account → Sign in */}
        <Pressable
          accessibilityRole="button"
          onPress={onSignIn}
          hitSlop={6}
          style={{ paddingVertical: 6, paddingHorizontal: 12 }}
        >
          <Text
            style={{
              fontFamily: FONT_BODY_MEDIUM,
              fontSize: 14,
              fontWeight: '500',
              color: t.fg2,
              textAlign: 'center',
            }}
          >
            {translate('welcome.cta_sign_in_prefix')}{' '}
            <Text
              style={{
                color: t.accent,
                fontWeight: '600',
                fontFamily: FONT_BODY_SEMI,
              }}
            >
              {translate('welcome.cta_sign_in')}
            </Text>
          </Text>
        </Pressable>

        {/* Trust line */}
        <Text
          style={{
            fontFamily: FONT_BODY_MEDIUM,
            fontSize: 11,
            fontWeight: '500',
            color: t.fg3,
            letterSpacing: 0.44,
            textAlign: 'center',
            marginTop: 4,
          }}
        >
          {translate('welcome.trust_line')}
        </Text>
      </View>
    </View>
  );
}
