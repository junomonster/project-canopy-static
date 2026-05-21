import { NavLink, Link } from 'react-router-dom';
import CanopyMark from './CanopyMark';

export default function Header() {
  return (
    <header className="site-header">
      <Link to="/" className="home-link" aria-label="Project Canopy home">
        <CanopyMark size={28} />
        <span className="brand-text">Project Canopy</span>
      </Link>
      <nav className="primary-nav" aria-label="Primary">
        <NavLink to="/faq" className="nav-link" end>
          FAQ
        </NavLink>
        <NavLink to="/join" className="nav-link" end>
          Join
        </NavLink>
      </nav>
    </header>
  );
}
