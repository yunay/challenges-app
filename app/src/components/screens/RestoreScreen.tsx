// Daily Challenges — Restore screen.
// Shown after sign-in when user_profiles.deleted_at is set and we're still
// inside the 30-day grace window. The user picks "Restore" (clears
// deleted_at, returns to normal flow) or "Continue with deletion" (signs
// out; the row stays marked and the purge job will eventually delete it).

import { type JSX } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
  type ViewStyle,
} from 'react-native';

// ---------------------------------------------------------------------------
// Theme tokens (mirror the rest of the app — Warm Amber on Stone)
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
    onAccent: '#FFFFFF',
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
    onAccent: '#15161A',
    error: '#FC8181',
  },
} as const;

type ThemeName = keyof typeof THEMES;
type Theme = (typeof THEMES)[ThemeName];

const FONT_DISPLAY = 'PlusJakartaSans_700Bold';
const FONT_BODY = 'Inter_400Regular';
const FONT_BODY_SEMI = 'Inter_600SemiBold';

export interface RestoreScreenProps {
  theme: ThemeName;
  /** Pre-formatted absolute date for the body copy (e.g. "12 June 2026"). */
  purgeDateLabel: string;
  /** True while either action is in flight; disables both CTAs. */
  pending: boolean;
  error?: string | null;
  onRestore: () => void;
  onContinueDeletion: () => void;
}

export default function RestoreScreen({
  theme,
  purgeDateLabel,
  pending,
  error,
  onRestore,
  onContinueDeletion,
}: RestoreScreenProps): JSX.Element {
  const t: Theme = theme === 'dark' ? THEMES.dark : THEMES.light;
  const { t: translate } = useTranslation();

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingTop: 60,
          paddingHorizontal: 28,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          accessibilityRole="header"
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 28,
            fontWeight: '700',
            color: t.fg1,
            letterSpacing: -0.7,
            lineHeight: 32,
            marginBottom: 12,
          }}
        >
          {translate('restore.title')}
        </Text>

        <Text
          style={{
            fontSize: 15,
            color: t.fg2,
            lineHeight: 22,
            fontFamily: FONT_BODY,
            marginBottom: 28,
          }}
        >
          {translate('restore.body', { date: purgeDateLabel })}
        </Text>

        {error ? (
          <Text
            style={{
              fontSize: 13,
              color: t.error,
              fontWeight: '500',
              fontFamily: FONT_BODY_SEMI,
              marginBottom: 14,
              textAlign: 'center',
            }}
          >
            {error}
          </Text>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: pending }}
          disabled={pending}
          onPress={onRestore}
          style={{
            width: '100%',
            height: 52,
            borderRadius: 14,
            backgroundColor: pending ? t.surface2 : t.accent,
            borderWidth: pending ? 1 : 0,
            borderColor: pending ? t.border : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 10,
            shadowColor: pending ? 'transparent' : t.accent,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: pending ? 0 : 0.2,
            shadowRadius: 14,
            elevation: pending ? 0 : 4,
          }}
        >
          {pending ? (
            <ActivityIndicator color={t.fg2} />
          ) : (
            <Text
              style={{
                color: t.onAccent,
                fontFamily: FONT_BODY_SEMI,
                fontSize: 16,
                fontWeight: '600',
                letterSpacing: -0.08,
              }}
            >
              {translate('restore.restore_button')}
            </Text>
          )}
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: pending }}
          disabled={pending}
          onPress={onContinueDeletion}
          style={{
            width: '100%',
            height: 52,
            borderRadius: 14,
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderColor: t.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              color: t.fg2,
              fontFamily: FONT_BODY_SEMI,
              fontSize: 15,
              fontWeight: '600',
              letterSpacing: -0.075,
            }}
          >
            {translate('restore.continue_deletion')}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
