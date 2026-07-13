import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import { renderAnswer } from '../lib/renderAnswer';
import { injectJsonLd, stripAnswerMarkers } from '../lib/jsonLd';
import { useCurrentLang } from '../i18n/useCurrentLang';

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqData {
  ko?: { items?: FaqItem[] };
  en?: { items?: FaqItem[] };
  items?: FaqItem[];
}

type Status = 'loading' | 'ready' | 'empty' | 'error';

export default function Faq() {
  const { t } = useTranslation();
  const lang = useCurrentLang();

  const [data, setData] = useState<FaqData | null>(null);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    document.title = t('faq.documentTitle');
  }, [t]);

  useEffect(() => {
    let cancelled = false;
    fetch('/faq/faq.json', { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then((json: FaqData) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        if (!cancelled) setErrored(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const items = useMemo<FaqItem[] | null>(() => {
    if (data == null) return null;
    return (
      data[lang]?.items ??
      data.en?.items ??
      data.ko?.items ??
      data.items ??
      []
    );
  }, [data, lang]);

  const status: Status = errored
    ? 'error'
    : items == null
      ? 'loading'
      : items.length === 0
        ? 'empty'
        : 'ready';

  useEffect(() => {
    if (!items || items.length === 0) return;
    return injectJsonLd('faq-jsonld', {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      '@id': 'https://project-canopy.com/faq#faqpage',
      inLanguage: lang,
      mainEntity: items.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: stripAnswerMarkers(item.answer),
        },
      })),
    });
  }, [items, lang]);

  return (
    <>
      <Header />
      <main className="page">
        <h1 className="page-title">
          {t('faq.titlePart1')} <em>{t('faq.titlePart2')}</em>
        </h1>
        <ul className="faq-list">
          {status === 'loading' && (
            <li className="faq-empty">{t('faq.loading')}</li>
          )}
          {status === 'empty' && (
            <li className="faq-empty">{t('faq.empty')}</li>
          )}
          {status === 'error' && (
            <li className="faq-empty">{t('faq.error')}</li>
          )}
          {status === 'ready' &&
            items?.map((item, idx) => (
              <li className="faq-item" key={`${lang}-${idx}`}>
                <h3>{item.question}</h3>
                <p>{renderAnswer(item.answer)}</p>
              </li>
            ))}
        </ul>
      </main>
      <footer className="page-footer">
        <Link className="footer-link" to="/join">
          {t('faq.footerCta')}
        </Link>
      </footer>
    </>
  );
}
