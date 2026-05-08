import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import en from './en.json';
import bg from './bg.json';

export const SUPPORTED_LANGUAGES = ['en', 'bg'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const FALLBACK_LANGUAGE: SupportedLanguage = 'en';

function detectLanguage(): SupportedLanguage {
  const deviceLanguage = Localization.getLocales()[0]?.languageCode ?? FALLBACK_LANGUAGE;
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(deviceLanguage)
    ? (deviceLanguage as SupportedLanguage)
    : FALLBACK_LANGUAGE;
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    bg: { translation: bg },
  },
  lng: detectLanguage(),
  fallbackLng: FALLBACK_LANGUAGE,
  interpolation: { escapeValue: false },
  returnNull: false,
  compatibilityJSON: 'v4',
});

export default i18n;
