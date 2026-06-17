import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { normalizeLang, type SupportedLang } from './index';

export function useCurrentLang(): SupportedLang {
  const { i18n } = useTranslation();
  const [lang, setLang] = useState<string>(
    i18n.resolvedLanguage ?? i18n.language,
  );

  useEffect(() => {
    const handler = (next: string) => setLang(next);
    i18n.on('languageChanged', handler);
    return () => {
      i18n.off('languageChanged', handler);
    };
  }, [i18n]);

  return normalizeLang(lang);
}
