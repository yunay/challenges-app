import { router } from 'expo-router';
import { useEffect, useState, type JSX } from 'react';
import { useTranslation } from 'react-i18next';

import SettingsScreen, {
  type GenderValue,
  type LanguageOption,
} from '@/components/screens/SettingsScreen';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/i18n';
import { supabase } from '@/services/supabase';
import { GENDER_VALUES, useAuthStore } from '@/store/authStore';

// Self-referential labels — each language names itself in itself, so they
// don't go through i18n. Mirrors profile.tsx (kept duplicated for now since
// it's a 2-entry constant; if a third language lands we can lift to a shared
// module).
const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  en: 'English',
  bg: 'Български',
};

const LANGUAGE_OPTIONS: ReadonlyArray<LanguageOption> = SUPPORTED_LANGUAGES.map(
  (code) => ({ code, label: LANGUAGE_LABELS[code] }),
);

function languageLabel(lang: string): string {
  return (
    LANGUAGE_LABELS[lang as SupportedLanguage] ?? LANGUAGE_LABELS.en
  );
}

function isSupportedLanguage(code: string): code is SupportedLanguage {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(code);
}

function isGenderValue(v: unknown): v is GenderValue {
  return typeof v === 'string' && (GENDER_VALUES as readonly string[]).includes(v);
}

export default function SettingsRoute(): JSX.Element {
  const { i18n } = useTranslation();
  const session = useAuthStore((s) => s.session);
  const user = useAuthStore((s) => s.user);
  const setLanguage = useAuthStore((s) => s.setLanguage);
  const setGoals = useAuthStore((s) => s.setGoals);
  const setGender = useAuthStore((s) => s.setGender);
  const signOut = useAuthStore((s) => s.signOut);
  const requestAccountDeletion = useAuthStore((s) => s.requestAccountDeletion);

  // Settings sits at the root stack level (sibling to (auth) and (tabs))
  // and has no group-level auth gate, unlike (tabs)/_layout.tsx. Any flow
  // that ends in signOut from this screen — Sign out row, Delete account
  // success — would otherwise strand the user here with session=null, and
  // a subsequent action would hit "Not signed in" inside the store. Bounce
  // to the root index so the boot router can redirect to /welcome.
  useEffect(() => {
    if (!session) router.replace('/');
  }, [session]);

  // Goals + gender are not cached in the store — read once on mount in a
  // single round-trip. Empty array / null are the safe defaults while
  // loading; the rows render "0 selected" / "Not set" until the fetch
  // resolves (<100ms typical).
  const [goals, setGoalsState] = useState<ReadonlyArray<string>>([]);
  const [gender, setGenderState] = useState<GenderValue | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async (): Promise<void> => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('goals, gender')
        .eq('id', user.id)
        .maybeSingle<{ goals: string[] | null; gender: string | null }>();
      if (cancelled) return;
      if (error) {
        console.warn('[settings] fetch profile failed:', error.message);
        return;
      }
      if (data?.goals) setGoalsState(data.goals);
      if (isGenderValue(data?.gender)) setGenderState(data.gender);
    })();
    return (): void => {
      cancelled = true;
    };
  }, [user]);

  return (
    <SettingsScreen
      theme="light"
      goals={goals}
      gender={gender}
      languageLabel={languageLabel(i18n.language)}
      languageOptions={LANGUAGE_OPTIONS}
      currentLanguageCode={i18n.language}
      onBack={(): void => router.back()}
      onGoalsChange={async (next): Promise<{ ok: boolean; error?: string }> => {
        const result = await setGoals([...next]);
        if (result.ok) setGoalsState(next);
        return result;
      }}
      onLanguageChange={async (code): Promise<{ ok: boolean; error?: string }> => {
        if (!isSupportedLanguage(code)) {
          return { ok: false, error: `Unsupported language: ${code}` };
        }
        return setLanguage(code);
      }}
      onGenderChange={async (next): Promise<{ ok: boolean; error?: string }> => {
        const result = await setGender(next);
        if (result.ok) setGenderState(next);
        return result;
      }}
      // Just performs the signOut — confirmation UX is owned by
      // SettingsScreen's SignOutConfirmModal. Alert.alert was unreliable
      // (silent failure on web, intermittent on some native dev clients);
      // an in-app Modal renders consistently. After session clears, the
      // session-watch useEffect above runs router.replace('/') and the
      // boot router redirects to /welcome.
      onSignOut={async (): Promise<void> => {
        await signOut();
      }}
      onDeleteAccount={async (password): Promise<{ ok: boolean; error?: string }> => {
        // requestAccountDeletion handles the full chain (re-auth → RPC →
        // signOut) and surfaces 'wrong_password' as a stable marker so the
        // modal can render a localized hint.
        return requestAccountDeletion(password);
      }}
    />
  );
}
