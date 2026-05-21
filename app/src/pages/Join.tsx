import { useCallback, useEffect, useState } from 'react';
import Header from '../components/Header';
import CanopyMark from '../components/CanopyMark';

const FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSeO7Ypqiawf5NGQD1uOqIhcoXFF_NnwHeLnmhs5vt5AI8PVKg/viewform?embedded=true';

type LoaderPhase = 'visible' | 'hiding' | 'gone';

export default function Join() {
  const [phase, setPhase] = useState<LoaderPhase>('visible');

  useEffect(() => {
    document.title = 'Project Canopy · Join';
  }, []);

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
    const t = window.setTimeout(() => setPhase('gone'), 500);
    return () => window.clearTimeout(t);
  }, [phase]);

  return (
    <>
      <Header />
      <div className="stage">
        <div className="stage-label">Participation Form</div>
        <div className="card">
          {phase !== 'gone' && (
            <div
              className={`loader${phase === 'hiding' ? ' hidden' : ''}`}
              role="status"
              aria-label="Loading form"
            >
              <CanopyMark size={56} className="loader-mark" stroke="#28d27d" />
              <div className="loader-label">
                Loading
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
            title="Project Canopy — Interest Form"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            onLoad={beginHide}
          />
        </div>
      </div>
    </>
  );
}
