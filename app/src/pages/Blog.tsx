import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import { getAllPosts } from '../lib/blog';
import { useCurrentLang } from '../i18n/useCurrentLang';

function formatDate(iso: string, lang: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function Blog() {
  const { t } = useTranslation();
  const lang = useCurrentLang();
  const posts = getAllPosts();

  useEffect(() => {
    document.title = t('blog.documentTitle');
  }, [t]);

  return (
    <>
      <Header />
      <main className="page">
        <h1 className="page-title">
          {t('blog.titlePart1')} <em>{t('blog.titlePart2')}</em>
        </h1>
        {posts.length === 0 ? (
          <p className="faq-empty">{t('blog.empty')}</p>
        ) : (
          <ul className="post-list">
            {posts.map((post) => (
              <li className="post-card" key={post.slug}>
                <Link to={`/blog/${post.slug}`} className="post-card-link">
                  <div className="post-card-meta">
                    <time dateTime={post.date}>
                      {formatDate(post.date, lang)}
                    </time>
                    <span className="post-meta-dot">·</span>
                    <span>
                      {t('blog.readingTime', { count: post.readingMinutes })}
                    </span>
                  </div>
                  <h2 className="post-card-title">{post.title}</h2>
                  {post.description ? (
                    <p className="post-card-desc">{post.description}</p>
                  ) : null}
                  {post.tags.length > 0 ? (
                    <ul className="post-tags">
                      {post.tags.map((tag) => (
                        <li key={tag}>{tag}</li>
                      ))}
                    </ul>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
