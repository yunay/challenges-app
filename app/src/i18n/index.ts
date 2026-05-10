import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './en.json';
import bg from './bg.json';

export const SUPPORTED_LANGUAGES = ['en', 'bg'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const FALLBACK_LANGUAGE: SupportedLanguage = 'en';

// AsyncStorage key for the device-side cached language. Mirrors the
// server source of truth (user_profiles.language) so we can render the
// correct UI on cold start without waiting for the profile fetch.
export const LANGUAGE_STORAGE_KEY = 'app.language';

function isSupported(code: string | null | undefined): code is SupportedLanguage {
  return (
    typeof code === 'string' &&
    (SUPPORTED_LANGUAGES as readonly string[]).includes(code)
  );
}

// AsyncStorage is async-only, so we can't read it synchronously inside the
// i18next init call. We init with the fallback synchronously (no flash of
// wrong content for first-time users since English IS the fallback), then
// the cached language — if any — is applied in the background as soon as
// AsyncStorage resolves. Calling code that mounts after this module finishes
// loading will see `i18n.language === FALLBACK_LANGUAGE`; the changeLanguage
// call rerenders consumers once the cache lands.
void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    bg: { translation: bg },
  },
  lng: FALLBACK_LANGUAGE,
  fallbackLng: FALLBACK_LANGUAGE,
  interpolation: { escapeValue: false },
  returnNull: false,
  compatibilityJSON: 'v4',
});

// Fire-and-forget cache hydration. If AsyncStorage holds a previously
// persisted language, apply it. Any error (missing key, JSON parse, native
// module unavailable in a test) is swallowed — English is a safe default.
void (async (): Promise<void> => {
  try {
    const cached = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (isSupported(cached) && cached !== i18n.language) {
      await i18n.changeLanguage(cached);
    }
  } catch (err) {
    console.warn('[i18n] cache hydration failed:', err);
  }
})();

export default i18n;
