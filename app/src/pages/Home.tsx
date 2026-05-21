import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import CanopyMark from '../components/CanopyMark';

export default function Home() {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = t('home.documentTitle');
  }, [t]);

  return (
    <>
      <Header />
      <main className="hero">
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
    </>
  );
}
