import { useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import Header from '../components/Header';
import { buildToc, getPost } from '../lib/blog';
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

export default function BlogPost() {
  const { slug = '' } = useParams();
  const { t } = useTranslation();
  const lang = useCurrentLang();
  const post = getPost(slug);
  const toc = useMemo(() => (post ? buildToc(post.body) : []), [post]);

  useEffect(() => {
    document.title = post
      ? `${post.title} — Project Canopy`
      : 'Project Canopy';
  }, [post]);

  const components = useMemo<Components>(() => {
    return {
      p: ({ node, children }) => {
        // Images become block-level <figure>; unwrap image-only paragraphs so
        // we don't nest a <figure> inside a <p> (invalid DOM).
        const kids = node?.children ?? [];
        const onlyImage =
          kids.length === 1 &&
          kids[0].type === 'element' &&
          kids[0].tagName === 'img';
        if (onlyImage) return <>{children}</>;
        return <p>{children}</p>;
      },
      a: ({ href, children }) => {
        const external = /^https?:\/\//.test(href ?? '');
        return (
          <a
            href={href}
            {...(external
              ? { target: '_blank', rel: 'noopener noreferrer' }
              : {})}
          >
            {children}
          </a>
        );
      },
      img: ({ src, alt }) => {
        const url = typeof src === 'string' ? src : undefined;
        // SVG charts carry their own title/legend, so skip the visible caption
        // (alt is still on <img> for accessibility). Raster figures keep it.
        const isSvg = url?.toLowerCase().endsWith('.svg');
        return (
          <figure className="post-figure">
            <img src={url} alt={alt ?? ''} loading="lazy" />
            {alt && !isSvg ? <figcaption>{alt}</figcaption> : null}
          </figure>
        );
      },
    };
  }, []);

  return (
    <>
      <Header />
      {!post ? (
        <main className="page">
          <h1 className="page-title">{t('blog.notFoundTitle')}</h1>
          <p className="post-lead">{t('blog.notFoundBody')}</p>
          <Link className="footer-link" to="/blog">
            {t('blog.backToList')}
          </Link>
        </main>
      ) : (
        <main className="post-layout">
          <article className="post">
            <div className="post-header">
              <Link className="post-back" to="/blog">
                ← {t('blog.backToList')}
              </Link>
              <div className="post-meta">
                <time dateTime={post.date}>{formatDate(post.date, lang)}</time>
                <span className="post-meta-dot">·</span>
                <span>{t('blog.readingTime', { count: post.readingMinutes })}</span>
                {post.author ? (
                  <>
                    <span className="post-meta-dot">·</span>
                    <span>{post.author}</span>
                  </>
                ) : null}
              </div>
              <h1 id="post-top" className="post-title">{post.title}</h1>
              {post.description ? (
                <p className="post-lead">{post.description}</p>
              ) : null}
              {post.tags.length > 0 ? (
                <ul className="post-tags">
                  {post.tags.map((tag) => (
                    <li key={tag}>{tag}</li>
                  ))}
                </ul>
              ) : null}
            </div>
            <div className="prose">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw, rehypeSlug]}
                components={components}
              >
                {post.body}
              </ReactMarkdown>
            </div>
          </article>

          {toc.length > 0 ? (
            <aside className="post-toc" aria-label={t('blog.tocLabel')}>
              <div className="post-toc-inner">
                <p className="post-toc-title">{t('blog.tocLabel')}</p>
                <nav>
                  <ul>
                    <li className="toc-top">
                      <a href="#post-top">{t('blog.tocTop')}</a>
                    </li>
                    {toc.map((item) => (
                      <li
                        key={item.id}
                        className={item.depth === 3 ? 'toc-sub' : undefined}
                      >
                        <a href={`#${item.id}`}>{item.text}</a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            </aside>
          ) : null}
        </main>
      )}
    </>
  );
}
