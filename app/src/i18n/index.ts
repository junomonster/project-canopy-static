import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import ko from './locales/ko.json';

export const SUPPORTED_LANGS = ['ko', 'en'] as const;
export type SupportedLang = (typeof SUPPORTED_LANGS)[number];

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ko: { translation: ko },
    },
    fallbackLng: 'ko',
    supportedLngs: SUPPORTED_LANGS,
    nonExplicitSupportedLngs: true,
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'canopy.lang',
    },
  });

export function normalizeLang(lang: string): SupportedLang {
  const base = lang.split('-')[0];
  return (SUPPORTED_LANGS as readonly string[]).includes(base)
    ? (base as SupportedLang)
    : 'ko';
}

export default i18n;
