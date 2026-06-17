import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import CanopyMark from '../components/CanopyMark';
import PressReleaseModal from '../components/PressReleaseModal';
import { PRESS_LINKS } from '../lib/pressLinks';
import { useCurrentLang } from '../i18n/useCurrentLang';

export default function Home() {
  const { t } = useTranslation();
  const locale = useCurrentLang();

  useEffect(() => {
    document.title = t('home.documentTitle');
  }, [t]);

  return (
    <>
      <Header />
      <main className="hero">
        <a
          className="press-pill"
          href={PRESS_LINKS[locale]}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="press-pill-eyebrow">PRESS</span>
          <span>{t('home.pressLink')}</span>
        </a>
        <CanopyMark
          size={80}
          className="canopy-mark"
          ariaLabel="Project Canopy"
        />
        <h1 className="hero-title">
          {t('home.titlePart1')} <em>{t('home.titlePart2')}</em>
        </h1>
        <Link className="cta" to="/join">
          <span className="cta-main">{t('home.ctaMain')}</span>
          <span className="cta-sub">{t('home.ctaSub')}</span>
        </Link>
        <Link className="faq-link" to="/faq">
          {t('home.faqLink')}
        </Link>
      </main>
      <PressReleaseModal />
    </>
  );
}
