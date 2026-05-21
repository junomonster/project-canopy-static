import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { normalizeLang, SUPPORTED_LANGS, type SupportedLang } from '../i18n';

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const current = normalizeLang(i18n.language);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (target && rootRef.current && !rootRef.current.contains(target)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const choose = (lang: SupportedLang) => {
    setOpen(false);
    if (lang !== current) void i18n.changeLanguage(lang);
  };

  return (
    <div ref={rootRef} className="lang-switcher">
      <button
        type="button"
        className="lang-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('lang.switchAriaLabel')}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{t(`lang.${current}`)}</span>
        <svg
          className="lang-chevron"
          width="8"
          height="6"
          viewBox="0 0 8 6"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M1 1L4 4L7 1"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && (
        <ul className="lang-menu" role="listbox">
          {SUPPORTED_LANGS.map((lang) => (
            <li key={lang} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={lang === current}
                className={`lang-option${lang === current ? ' active' : ''}`}
                onClick={() => choose(lang)}
              >
                {t(`lang.${lang}`)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
