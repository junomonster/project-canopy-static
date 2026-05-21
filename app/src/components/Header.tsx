import { NavLink, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import CanopyMark from './CanopyMark';
import LanguageSwitcher from './LanguageSwitcher';

export default function Header() {
  const { t } = useTranslation();

  return (
    <header className="site-header">
      <Link to="/" className="home-link" aria-label={t('nav.homeAriaLabel')}>
        <CanopyMark size={28} />
        <span className="brand-text">Project Canopy</span>
      </Link>
      <div className="header-right">
        <nav className="primary-nav" aria-label="Primary">
          <NavLink to="/faq" className="nav-link" end>
            {t('nav.faq')}
          </NavLink>
          <NavLink to="/join" className="nav-link" end>
            {t('nav.join')}
          </NavLink>
        </nav>
        <LanguageSwitcher />
      </div>
    </header>
  );
}
