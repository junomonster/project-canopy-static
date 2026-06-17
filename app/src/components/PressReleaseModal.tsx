import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PRESS_LINKS } from '../lib/pressLinks';

const OPEN_DELAY_MS = 500;
const DISMISS_KEY = 'canopy.press.dismissedUntil';

const PRESS_BUTTONS = [
  { code: 'ko', label: '보도자료 확인하기 (KO) →', url: PRESS_LINKS.ko },
  { code: 'en', label: 'Read Press Release (EN) →', url: PRESS_LINKS.en },
] as const;

function readDismissedUntil(): number {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return 0;
    const value = Number.parseInt(raw, 10);
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

function writeDismissedUntil(expiry: number) {
  try {
    localStorage.setItem(DISMISS_KEY, String(expiry));
  } catch {
    // ignore (e.g. private mode)
  }
}

function endOfTodayMs(): number {
  const next = new Date();
  next.setHours(24, 0, 0, 0);
  return next.getTime();
}

export default function PressReleaseModal() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (readDismissedUntil() > Date.now()) return;
    const timer = window.setTimeout(() => setOpen(true), OPEN_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  const close = () => setOpen(false);

  const dismissForToday = () => {
    writeDismissedUntil(endOfTodayMs());
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      onClick={close}
      role="presentation"
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="press-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="modal-close"
          aria-label={t('press.close')}
          onClick={close}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path
              d="M1 1L13 13M13 1L1 13"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <div className="modal-eyebrow">{t('press.eyebrow')}</div>
        <h2 className="modal-title" id="press-modal-title">
          {t('press.title')}
        </h2>
        <p className="modal-description">{t('press.description')}</p>
        <div className="modal-actions">
          {PRESS_BUTTONS.map((link) => (
            <a
              key={link.code}
              className="modal-cta"
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {link.label}
            </a>
          ))}
        </div>
        <button
          type="button"
          className="modal-dismiss"
          onClick={dismissForToday}
        >
          {t('press.dontShowToday')}
        </button>
      </div>
    </div>
  );
}
