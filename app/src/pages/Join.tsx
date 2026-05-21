import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import CanopyMark from '../components/CanopyMark';

const FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSdmrxjV1jVPBilCyV3mim3-c7AQNogU9rZZ2mDYoS2EPYiLqA/viewform?embedded=true';

type LoaderPhase = 'visible' | 'hiding' | 'gone';

export default function Join() {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<LoaderPhase>('visible');

  useEffect(() => {
    document.title = t('join.documentTitle');
  }, [t]);

  useEffect(() => {
    document.body.dataset.page = 'join';
    return () => {
      delete document.body.dataset.page;
    };
  }, []);

  const beginHide = useCallback(() => {
    setPhase((current) => (current === 'visible' ? 'hiding' : current));
  }, []);

  useEffect(() => {
    const fallback = window.setTimeout(beginHide, 15000);
    return () => window.clearTimeout(fallback);
  }, [beginHide]);

  useEffect(() => {
    if (phase !== 'hiding') return;
    const timer = window.setTimeout(() => setPhase('gone'), 500);
    return () => window.clearTimeout(timer);
  }, [phase]);

  return (
    <>
      <Header />
      <div className="stage">
        <div className="stage-label">{t('join.label')}</div>
        <div className="card">
          {phase !== 'gone' && (
            <div
              className={`loader${phase === 'hiding' ? ' hidden' : ''}`}
              role="status"
              aria-label={t('join.loaderAriaLabel')}
            >
              <CanopyMark size={56} className="loader-mark" stroke="#28d27d" />
              <div className="loader-label">
                {t('join.loading')}
                <span className="dots">
                  <span>.</span>
                  <span>.</span>
                  <span>.</span>
                </span>
              </div>
            </div>
          )}
          <iframe
            src={FORM_URL}
            title={t('join.iframeTitle')}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            onLoad={beginHide}
          />
        </div>
      </div>
    </>
  );
}
