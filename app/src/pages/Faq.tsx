import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import { renderAnswer } from '../lib/renderAnswer';

interface FaqItem {
  question: string;
  answer: string;
}

type Status = 'loading' | 'ready' | 'empty' | 'error';

export default function Faq() {
  const [items, setItems] = useState<FaqItem[]>([]);
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    document.title = 'Project Canopy · FAQ';
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('/faq/faq.json', { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then((data: { items?: FaqItem[] }) => {
        if (cancelled) return;
        const next = Array.isArray(data.items) ? data.items : [];
        setItems(next);
        setStatus(next.length === 0 ? 'empty' : 'ready');
      })
      .catch(() => {
        if (cancelled) return;
        setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <Header />
      <main className="page">
        <div className="page-label">Frequently Asked Questions</div>
        <h1 className="page-title">
          Questions <em>and answers.</em>
        </h1>
        <div className="page-subtitle">자주 묻는 질문</div>
        <ul className="faq-list">
          {status === 'loading' && <li className="faq-empty">Loading…</li>}
          {status === 'empty' && <li className="faq-empty">No questions yet.</li>}
          {status === 'error' && (
            <li className="faq-empty">Unable to load FAQ. Try refreshing.</li>
          )}
          {status === 'ready' &&
            items.map((item, idx) => (
              <li className="faq-item" key={idx}>
                <h3>{item.question}</h3>
                <p>{renderAnswer(item.answer)}</p>
              </li>
            ))}
        </ul>
      </main>
      <footer className="page-footer">
        <Link className="footer-link" to="/join">
          Express Interest →
        </Link>
      </footer>
    </>
  );
}
