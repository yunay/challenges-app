// Daily Challenges — Auth screens (React Native port of handoff/auth-screens.jsx).
// One file ships both Login and Register; pick via the `mode` prop or use the
// named exports directly. Demo defaults match the handoff fixtures.
//
// Requires: react-native-svg (install via `npx expo install react-native-svg`).

import { useState, type JSX, type ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type ViewStyle,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

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
    accentRingRgba: 'rgba(217,119,6,0.08)',
    accentGlow: 'rgba(217,119,6,0.20)',
    onAccent: '#FFFFFF',
    appleBg: '#000000',
    appleFg: '#FFFFFF',
    googleBg: '#FFFFFF',
    logoStroke: '#5E3102',
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
    border2: '#3D404A',
    accent: '#F5B14E',
    accentRingRgba: 'rgba(245,177,78,0.10)',
    accentGlow: 'rgba(245,177,78,0.20)',
    onAccent: '#15161A',
    appleBg: '#FFFFFF',
    appleFg: '#000000',
    googleBg: '#1E1F24',
    logoStroke: '#3A1E01',
    error: '#FC8181',
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

interface EyeIconProps {
  open: boolean;
  color: string;
  size?: number;
}

const EyeIcon = ({ open, color, size = 18 }: EyeIconProps): JSX.Element => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    {open ? (
      <>
        <Path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
        <Circle cx={12} cy={12} r={3} />
      </>
    ) : (
      <>
        <Path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
        <Path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
        <Path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
        <Path d="m2 2 20 20" />
      </>
    )}
  </Svg>
);

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

interface AppleLogoProps {
  size?: number;
  color: string;
}

const AppleLogo = ({ size = 18, color }: AppleLogoProps): JSX.Element => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M17.05 20.28c-.98.95-2.05.86-3.08.4-1.09-.47-2.09-.5-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
  </Svg>
);

const GoogleLogo = ({ size = 18 }: { size?: number }): JSX.Element => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <Path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <Path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.37-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <Path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </Svg>
);

interface LogoGlyphProps {
  size?: number;
  t: Theme;
}

const LogoGlyph = ({ size = 44, t }: LogoGlyphProps): JSX.Element => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Path d="M16 27C16 19 11 14 6 12C9 11 13.5 12 16 16C18.5 12 23 11 26 12C21 14 16 19 16 27Z" fill={t.accent} />
    <Path d="M16 27V16" stroke={t.logoStroke} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);

// ---------------------------------------------------------------------------
// Atoms
// ---------------------------------------------------------------------------

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: 'text' | 'email' | 'password';
  placeholder?: string;
  t: Theme;
  trailing?: ReactNode;
  error?: string | null;
  autoFocus?: boolean;
  showWhenSecure?: boolean;
}

const Field = ({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  t,
  trailing,
  error,
  autoFocus,
  showWhenSecure,
}: FieldProps): JSX.Element => {
  const [focused, setFocused] = useState(false);
  const isPassword = type === 'password';
  const isEmail = type === 'email';

  return (
    <View>
      <Text
        style={{
          fontSize: 12,
          color: t.fg2,
          fontWeight: '600',
          marginBottom: 6,
          letterSpacing: 0.12,
          fontFamily: FONT_BODY_SEMI,
        }}
      >
        {label}
      </Text>

      {/* Wrapper holds the field + an absolute focus glow that paints 4px
          outside the field box, recreating the box-shadow ring. */}
      <View>
        {focused && !error && (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: -4,
              left: -4,
              right: -4,
              bottom: -4,
              borderRadius: 16,
              backgroundColor: t.accentRingRgba,
            }}
          />
        )}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: t.surface,
            borderWidth: 1.5,
            borderColor: error ? t.error : focused ? t.accent : t.border,
            borderRadius: 12,
            height: 50,
            paddingHorizontal: 14,
          }}
        >
          <TextInput
            value={value}
            onChangeText={onChange}
            onFocus={(): void => setFocused(true)}
            onBlur={(): void => setFocused(false)}
            placeholder={placeholder}
            placeholderTextColor={t.fg4}
            autoFocus={autoFocus}
            secureTextEntry={isPassword && !showWhenSecure}
            keyboardType={isEmail ? 'email-address' : 'default'}
            autoCapitalize={isEmail || isPassword ? 'none' : 'words'}
            autoCorrect={!isEmail && !isPassword}
            style={{
              flex: 1,
              height: '100%',
              fontFamily: FONT_BODY_MEDIUM,
              fontSize: 15,
              color: t.fg1,
              fontWeight: '500',
              padding: 0,
            }}
          />
          {trailing}
        </View>
      </View>

      {error && (
        <Text
          style={{
            fontSize: 12,
            color: t.error,
            fontWeight: '500',
            marginTop: 5,
            fontFamily: FONT_BODY_MEDIUM,
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );
};

interface SocialButtonProps {
  provider: 'apple' | 'google';
  t: Theme;
  onPress?: () => void;
}

const SocialButton = ({ provider, t, onPress }: SocialButtonProps): JSX.Element => {
  const isApple = provider === 'apple';
  const bg = isApple ? t.appleBg : t.googleBg;
  const fg = isApple ? t.appleFg : t.fg1;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }): ViewStyle => ({
        width: '100%',
        height: 50,
        borderRadius: 12,
        backgroundColor: bg,
        borderWidth: isApple ? 0 : 1.5,
        borderColor: isApple ? 'transparent' : t.border2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        opacity: pressed ? 0.92 : 1,
        transform: [{ scale: pressed ? 0.99 : 1 }],
      })}
    >
      {isApple ? <AppleLogo color={t.appleFg} /> : <GoogleLogo />}
      <Text
        style={{
          color: fg,
          fontFamily: FONT_BODY_SEMI,
          fontSize: 15,
          fontWeight: '600',
          letterSpacing: -0.075,
        }}
      >
        Continue with {isApple ? 'Apple' : 'Google'}
      </Text>
    </Pressable>
  );
};

interface PrimaryAuthBtnProps {
  children: string;
  disabled?: boolean;
  t: Theme;
  onPress?: () => void;
}

const PrimaryAuthBtn = ({ children, disabled = false, t, onPress }: PrimaryAuthBtnProps): JSX.Element => (
  <Pressable
    accessibilityRole="button"
    accessibilityState={{ disabled }}
    disabled={disabled}
    onPress={onPress}
    style={({ pressed }): ViewStyle => ({
      width: '100%',
      height: 52,
      borderRadius: 14,
      backgroundColor: disabled ? t.surface2 : t.accent,
      borderWidth: disabled ? 1 : 0,
      borderColor: disabled ? t.border : 'transparent',
      alignItems: 'center',
      justifyContent: 'center',
      transform: [{ scale: pressed && !disabled ? 0.985 : 1 }],
      opacity: pressed && !disabled ? 0.94 : 1,
      // The accent glow under the active CTA — colored shadow, soft & wide.
      shadowColor: disabled ? 'transparent' : t.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: disabled ? 0 : 0.2,
      shadowRadius: 14,
      elevation: disabled ? 0 : 4,
    })}
  >
    <Text
      style={{
        color: disabled ? t.fg4 : t.onAccent,
        fontFamily: FONT_BODY_SEMI,
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: -0.08,
      }}
    >
      {children}
    </Text>
  </Pressable>
);

const Divider = ({ t }: { t: Theme }): JSX.Element => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 }}>
    <View style={{ flex: 1, height: 1, backgroundColor: t.border }} />
    <Text
      style={{
        fontSize: 12,
        color: t.fg3,
        fontWeight: '500',
        letterSpacing: 0.48,
        fontFamily: FONT_BODY_MEDIUM,
      }}
    >
      or
    </Text>
    <View style={{ flex: 1, height: 1, backgroundColor: t.border }} />
  </View>
);

interface AuthHeaderProps {
  t: Theme;
  title: string;
  subtitle: string;
}

const AuthHeader = ({ t, title, subtitle }: AuthHeaderProps): JSX.Element => (
  <View style={{ alignItems: 'center', marginBottom: 24 }}>
    <View style={{ marginBottom: 16 }}>
      <LogoGlyph size={44} t={t} />
    </View>
    <Text
      style={{
        fontFamily: FONT_DISPLAY,
        fontSize: 26,
        fontWeight: '700',
        color: t.fg1,
        marginBottom: 6,
        letterSpacing: -0.65,
        textAlign: 'center',
        lineHeight: 30,
      }}
    >
      {title}
    </Text>
    <Text
      style={{
        fontSize: 14,
        color: t.fg2,
        lineHeight: 21,
        textAlign: 'center',
        fontWeight: '400',
        fontFamily: FONT_BODY,
      }}
    >
      {subtitle}
    </Text>
  </View>
);

interface BackBarProps {
  t: Theme;
  onBack?: () => void;
}

const BackBar = ({ t, onBack }: BackBarProps): JSX.Element => (
  <View style={{ paddingTop: 60, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center' }}>
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Go back"
      onPress={onBack}
      hitSlop={12}
      style={{ padding: 4 }}
    >
      <ChevronLeftIcon color={t.fg2} />
    </Pressable>
  </View>
);

interface FooterLinkProps {
  t: Theme;
  prefix: string;
  cta: string;
  onPress?: () => void;
}

const FooterLink = ({ t, prefix, cta, onPress }: FooterLinkProps): JSX.Element => (
  <View
    style={{
      paddingTop: 14,
      paddingBottom: 36,
      paddingHorizontal: 20,
      borderTopWidth: 1,
      borderTopColor: t.border,
      alignItems: 'center',
      backgroundColor: t.bg,
    }}
  >
    <Text style={{ fontSize: 14, color: t.fg2, fontWeight: '400', fontFamily: FONT_BODY }}>
      {prefix}{' '}
      <Text
        onPress={onPress}
        style={{
          fontFamily: FONT_BODY_SEMI,
          fontSize: 14,
          fontWeight: '600',
          color: t.accent,
        }}
      >
        {cta}
      </Text>
    </Text>
  </View>
);

// ---------------------------------------------------------------------------
// Login screen
// ---------------------------------------------------------------------------

export interface LoginScreenProps {
  theme: ThemeName;
  onSubmit?: (email: string, password: string) => void;
  onBack?: () => void;
  onSwitchToRegister?: () => void;
  onForgotPassword?: () => void;
  onApple?: () => void;
  onGoogle?: () => void;
}

export function LoginScreen({
  theme,
  onSubmit,
  onBack,
  onSwitchToRegister,
  onForgotPassword,
  onApple,
  onGoogle,
}: LoginScreenProps): JSX.Element {
  const t: Theme = theme === 'dark' ? THEMES.dark : THEMES.light;
  const [email, setEmail] = useState('alex@hey.com');
  const [password, setPassword] = useState('••••••••');
  const [show, setShow] = useState(false);
  const canSubmit = email.includes('@') && password.length >= 6;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <BackBar t={t} onBack={onBack} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 24, paddingHorizontal: 24, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AuthHeader t={t} title="Welcome back" subtitle="Pick up where you left off." />

        <View style={{ gap: 14, marginBottom: 8 }}>
          <Field
            label="Email"
            value={email}
            onChange={setEmail}
            type="email"
            placeholder="you@example.com"
            t={t}
          />
          <Field
            label="Password"
            value={password}
            onChange={setPassword}
            type="password"
            showWhenSecure={show}
            placeholder="At least 6 characters"
            t={t}
            trailing={
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={show ? 'Hide password' : 'Show password'}
                onPress={(): void => setShow((s) => !s)}
                hitSlop={8}
                style={{ paddingHorizontal: 4, paddingVertical: 4 }}
              >
                <EyeIcon open={show} color={t.fg3} />
              </Pressable>
            }
          />
        </View>

        <View style={{ alignItems: 'flex-end', marginBottom: 18 }}>
          <Pressable accessibilityRole="button" onPress={onForgotPassword} hitSlop={6}>
            <Text
              style={{
                fontFamily: FONT_BODY_SEMI,
                fontSize: 13,
                fontWeight: '600',
                color: t.accent,
                paddingVertical: 6,
              }}
            >
              Forgot password?
            </Text>
          </Pressable>
        </View>

        <PrimaryAuthBtn
          t={t}
          disabled={!canSubmit}
          onPress={canSubmit ? (): void => onSubmit?.(email, password) : undefined}
        >
          Log in
        </PrimaryAuthBtn>

        <View style={{ marginTop: 20, marginBottom: 14 }}>
          <Divider t={t} />
        </View>

        <View style={{ gap: 10 }}>
          <SocialButton provider="apple" t={t} onPress={onApple} />
          <SocialButton provider="google" t={t} onPress={onGoogle} />
        </View>
      </ScrollView>

      <FooterLink t={t} prefix="New here?" cta="Create an account" onPress={onSwitchToRegister} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Register screen
// ---------------------------------------------------------------------------

export interface RegisterScreenProps {
  theme: ThemeName;
  onSubmit?: (data: { name: string; email: string; password: string }) => void;
  onBack?: () => void;
  onSwitchToLogin?: () => void;
  onApple?: () => void;
  onGoogle?: () => void;
  onTerms?: () => void;
  onPrivacy?: () => void;
}

export function RegisterScreen({
  theme,
  onSubmit,
  onBack,
  onSwitchToLogin,
  onApple,
  onGoogle,
  onTerms,
  onPrivacy,
}: RegisterScreenProps): JSX.Element {
  const t: Theme = theme === 'dark' ? THEMES.dark : THEMES.light;
  const [name, setName] = useState('Alex');
  const [email, setEmail] = useState('alex@hey.com');
  const [password, setPassword] = useState('••••••••');
  const [confirm, setConfirm] = useState('••••••••');
  const [show, setShow] = useState(false);

  const passwordsMismatch = confirm.length > 0 && confirm !== password;
  const canSubmit =
    name.length > 0 && email.includes('@') && password.length >= 6 && password === confirm;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <BackBar t={t} onBack={onBack} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 20, paddingHorizontal: 24, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AuthHeader t={t} title="Create your account" subtitle="One small thing a day. Takes 30 seconds." />

        {/* Social-first: lowest-friction path goes above the form */}
        <View style={{ gap: 10, marginBottom: 16 }}>
          <SocialButton provider="apple" t={t} onPress={onApple} />
          <SocialButton provider="google" t={t} onPress={onGoogle} />
        </View>

        <Divider t={t} />

        <View style={{ height: 16 }} />

        <View style={{ gap: 12, marginBottom: 18 }}>
          <Field
            label="Name"
            value={name}
            onChange={setName}
            placeholder="What should we call you?"
            t={t}
          />
          <Field
            label="Email"
            value={email}
            onChange={setEmail}
            type="email"
            placeholder="you@example.com"
            t={t}
          />
          <Field
            label="Password"
            value={password}
            onChange={setPassword}
            type="password"
            showWhenSecure={show}
            placeholder="At least 6 characters"
            t={t}
            trailing={
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={show ? 'Hide password' : 'Show password'}
                onPress={(): void => setShow((s) => !s)}
                hitSlop={8}
                style={{ paddingHorizontal: 4, paddingVertical: 4 }}
              >
                <EyeIcon open={show} color={t.fg3} />
              </Pressable>
            }
          />
          <Field
            label="Confirm password"
            value={confirm}
            onChange={setConfirm}
            type="password"
            showWhenSecure={show}
            placeholder="Type it again"
            t={t}
            error={passwordsMismatch ? "Passwords don't match" : null}
          />
        </View>

        <PrimaryAuthBtn
          t={t}
          disabled={!canSubmit}
          onPress={
            canSubmit ? (): void => onSubmit?.({ name, email, password }) : undefined
          }
        >
          Create account
        </PrimaryAuthBtn>

        <Text
          style={{
            fontSize: 12,
            color: t.fg3,
            fontWeight: '400',
            lineHeight: 18,
            marginTop: 14,
            textAlign: 'center',
            fontFamily: FONT_BODY,
          }}
        >
          By continuing you agree to our{' '}
          <Text
            onPress={onTerms}
            style={{
              color: t.fg2,
              fontWeight: '500',
              textDecorationLine: 'underline',
              fontFamily: FONT_BODY_MEDIUM,
            }}
          >
            Terms
          </Text>{' '}
          and{' '}
          <Text
            onPress={onPrivacy}
            style={{
              color: t.fg2,
              fontWeight: '500',
              textDecorationLine: 'underline',
              fontFamily: FONT_BODY_MEDIUM,
            }}
          >
            Privacy
          </Text>
          . We never sell your data and won't email you for marketing.
        </Text>
      </ScrollView>

      <FooterLink t={t} prefix="Already have an account?" cta="Log in" onPress={onSwitchToLogin} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Default export — mode-dispatching wrapper
// ---------------------------------------------------------------------------

export type AuthMode = 'login' | 'register';

export interface AuthScreenProps {
  mode: AuthMode;
  theme: ThemeName;
  onBack?: () => void;
  onApple?: () => void;
  onGoogle?: () => void;
  onSwitchMode?: () => void;
  onLoginSubmit?: (email: string, password: string) => void;
  onRegisterSubmit?: (data: { name: string; email: string; password: string }) => void;
  onForgotPassword?: () => void;
  onTerms?: () => void;
  onPrivacy?: () => void;
}

export default function AuthScreen({
  mode,
  theme,
  onBack,
  onApple,
  onGoogle,
  onSwitchMode,
  onLoginSubmit,
  onRegisterSubmit,
  onForgotPassword,
  onTerms,
  onPrivacy,
}: AuthScreenProps): JSX.Element {
  if (mode === 'register') {
    return (
      <RegisterScreen
        theme={theme}
        onBack={onBack}
        onApple={onApple}
        onGoogle={onGoogle}
        onSubmit={onRegisterSubmit}
        onSwitchToLogin={onSwitchMode}
        onTerms={onTerms}
        onPrivacy={onPrivacy}
      />
    );
  }
  return (
    <LoginScreen
      theme={theme}
      onBack={onBack}
      onApple={onApple}
      onGoogle={onGoogle}
      onSubmit={onLoginSubmit}
      onSwitchToRegister={onSwitchMode}
      onForgotPassword={onForgotPassword}
    />
  );
}
