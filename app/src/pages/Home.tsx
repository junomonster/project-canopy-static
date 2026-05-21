import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import CanopyMark from '../components/CanopyMark';

export default function Home() {
  useEffect(() => {
    document.title = "Project Canopy — Securing the world's software for the AI era.";
  }, []);

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
          Securing the world's software <em>for the AI era.</em>
        </h1>
        <Link className="cta" to="/join">
          <span className="cta-main">Express Interest →</span>
          <span className="cta-sub">참가 의향 제출</span>
        </Link>
        <Link className="faq-link" to="/faq">
          FAQ →
        </Link>
      </main>
    </>
  );
}
