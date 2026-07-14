// Build-time OG prerender + sitemap/RSS generation.
//
// Social/link crawlers (KakaoTalk, Slack, Twitter, Facebook, …) read raw HTML
// without executing JS, so a client-rendered SPA can only expose one set of
// OG tags (the ones baked into index.html). This script runs after `vite build`
// and emits a per-post static HTML file — dist/blog/<slug>/index.html — with
// title/description/OG/Twitter/canonical/BlogPosting JSON-LD derived from each
// post's frontmatter. Cloudflare's asset server returns that file for
// /blog/<slug>, so crawlers get per-post previews while users still get the SPA.
//
// It also writes dist/sitemap.xml and dist/rss.xml from the same frontmatter,
// so adding a Markdown post automatically updates both.

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP = join(__dirname, '..');
const SITE = 'https://project-canopy.com';
const DEFAULT_OG = '/og.png';
const CONTENT_DIR = join(APP, 'src/content/blog');
const DIST = join(APP, 'dist');

// --- minimal frontmatter parser (mirrors src/lib/blog.ts) ---
function parseFrontmatter(source) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(source);
  if (!m) return {};
  const data = {};
  const lines = m[1].split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();

    if (value === '|' || value === '>' || value === '|-' || value === '>-') {
      const literal = value.startsWith('|');
      const block = [];
      while (i + 1 < lines.length && (!lines[i + 1].trim() || /^\s/.test(lines[i + 1]))) {
        block.push(lines[++i]);
      }
      const indent = block.find((l) => l.trim())?.match(/^\s*/)?.[0].length ?? 0;
      const dedented = block.map((l) => l.slice(indent));
      data[key] = (literal ? dedented.join('\n') : dedented.join(' ')).trim();
      continue;
    }
    if (value.startsWith('[') && value.endsWith(']')) {
      const inner = value.slice(1, -1).trim();
      data[key] = inner
        ? inner.split(',').map((s) => s.trim().replace(/^["']|["']$/g, ''))
        : [];
      continue;
    }
    const q = value[0];
    if ((q === '"' || q === "'") && !(value.length > 1 && value.endsWith(q))) {
      const parts = [value.slice(1)];
      while (i + 1 < lines.length && !lines[i].trimEnd().endsWith(q)) parts.push(lines[++i]);
      let joined = parts.join(' ').trim();
      if (joined.endsWith(q)) joined = joined.slice(0, -1);
      data[key] = joined.trim();
      continue;
    }
    data[key] = value.replace(/^["']|["']$/g, '');
  }
  return data;
}

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

// One-line meta description from a possibly multi-line / bulleted value.
function toMetaDescription(desc) {
  return desc
    .split('\n')
    .map((l) => l.replace(/^\s*[-*]\s+/, '').trim())
    .filter(Boolean)
    .join(' · ')
    .replace(/\s+/g, ' ')
    .trim();
}

function absolute(path) {
  if (!path) return `${SITE}${DEFAULT_OG}`;
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE}${path.startsWith('/') ? '' : '/'}${path}`;
}

function ogImageFor(fm) {
  const candidate = fm.ogImage || fm.cover;
  // OG images must be raster; ignore SVG covers and fall back to the site image.
  if (candidate && /\.(png|jpe?g|webp|gif)$/i.test(candidate)) return absolute(candidate);
  return `${SITE}${DEFAULT_OG}`;
}

// --- HTML head rewriters ---
const setTitle = (html, v) => html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(v)}</title>`);

function setMeta(html, sel, value) {
  // sel like `property="og:title"` or `name="description"`
  const re = new RegExp(`(<meta ${sel} content=")[^"]*(")`);
  if (re.test(html)) return html.replace(re, `$1${esc(value)}$2`);
  // append before </head> if missing
  return html.replace('</head>', `  <meta ${sel} content="${esc(value)}" />\n</head>`);
}

const setCanonical = (html, url) =>
  html.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${esc(url)}$2`);

function buildHtml(template, post) {
  const url = `${SITE}/blog/${post.canonicalSlug}`;
  const metaTitle = `${post.title} — Project Canopy`;
  const metaDesc = toMetaDescription(post.description || '');
  const img = post.ogImage;

  let html = template;
  html = setTitle(html, metaTitle);
  html = setMeta(html, 'name="description"', metaDesc);
  html = setCanonical(html, url);
  html = setMeta(html, 'property="og:type"', 'article');
  html = setMeta(html, 'property="og:title"', post.title);
  html = setMeta(html, 'property="og:description"', metaDesc);
  html = setMeta(html, 'property="og:url"', url);
  html = setMeta(html, 'property="og:image"', img);
  html = setMeta(html, 'property="og:image:alt"', post.title);
  html = setMeta(html, 'name="twitter:title"', post.title);
  html = setMeta(html, 'name="twitter:description"', metaDesc);
  html = setMeta(html, 'name="twitter:image"', img);
  if (post.date) html = setMeta(html, 'property="article:published_time"', post.date);

  // BlogPosting structured data so schema.org validator / Rich Results Test
  // see the article without executing JS. `publisher` references the
  // Organization node already present in the template's @graph.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${url}#article`,
    headline: post.title,
    description: metaDesc,
    url,
    mainEntityOfPage: url,
    image: img,
    datePublished: post.date || undefined,
    inLanguage: 'ko',
    author: {
      '@type': 'Organization',
      name: post.author || 'Project Canopy',
      url: `${SITE}/`,
    },
    publisher: { '@id': `${SITE}/#organization` },
  };
  const jsonLdScript = `  <script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>\n</head>`;
  html = html.replace('</head>', jsonLdScript);
  return html;
}

// --- sitemap.xml ---
function buildSitemap(posts) {
  const latestPostDate = posts.map((p) => p.date).filter(Boolean).sort().pop();
  const staticUrls = [
    { loc: `${SITE}/`, changefreq: 'weekly', priority: '1.0' },
    { loc: `${SITE}/faq`, changefreq: 'weekly', priority: '0.8' },
    { loc: `${SITE}/blog`, lastmod: latestPostDate, changefreq: 'weekly', priority: '0.8' },
    { loc: `${SITE}/join`, changefreq: 'monthly', priority: '0.9' },
  ];
  const postUrls = posts.map((p) => ({
    loc: `${SITE}/blog/${p.canonicalSlug}`,
    lastmod: p.date || undefined,
    changefreq: 'monthly',
    priority: '0.7',
  }));

  const entries = [...staticUrls, ...postUrls]
    .map((u) => {
      const parts = [`    <loc>${esc(u.loc)}</loc>`];
      if (u.lastmod) parts.push(`    <lastmod>${esc(u.lastmod)}</lastmod>`);
      if (u.changefreq) parts.push(`    <changefreq>${u.changefreq}</changefreq>`);
      if (u.priority) parts.push(`    <priority>${u.priority}</priority>`);
      return `  <url>\n${parts.join('\n')}\n  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}

// --- rss.xml (RSS 2.0) ---
function buildRss(posts) {
  const toRfc822 = (isoDate) => new Date(`${isoDate}T00:00:00+09:00`).toUTCString();
  const latest = posts.map((p) => p.date).filter(Boolean).sort().pop();

  const items = posts
    .filter((p) => p.date)
    .map((p) => {
      const url = `${SITE}/blog/${p.canonicalSlug}`;
      return [
        '    <item>',
        `      <title>${esc(p.title)}</title>`,
        `      <link>${esc(url)}</link>`,
        `      <guid isPermaLink="true">${esc(url)}</guid>`,
        `      <pubDate>${toRfc822(p.date)}</pubDate>`,
        `      <description>${esc(toMetaDescription(p.description || ''))}</description>`,
        '    </item>',
      ].join('\n');
    })
    .join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    '    <title>Project Canopy Blog</title>',
    `    <link>${SITE}/blog</link>`,
    `    <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml" />`,
    '    <description>Research and updates from Project Canopy</description>',
    '    <language>ko</language>',
    ...(latest ? [`    <lastBuildDate>${toRfc822(latest)}</lastBuildDate>`] : []),
    items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');
}

// --- run ---
const template = readFileSync(join(DIST, 'index.html'), 'utf8');
const files = readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.md'));

const posts = [];
let count = 0;
for (const file of files) {
  const fm = parseFrontmatter(readFileSync(join(CONTENT_DIR, file), 'utf8'));
  const canonicalSlug = fm.slug || file.replace(/\.md$/, '');
  const post = {
    canonicalSlug,
    title: fm.title || canonicalSlug,
    description: fm.description || '',
    date: fm.date || '',
    author: fm.author || '',
    ogImage: ogImageFor(fm),
  };
  posts.push(post);
  const html = buildHtml(template, post);

  const slugs = [canonicalSlug, ...(Array.isArray(fm.aliases) ? fm.aliases : [])];
  for (const slug of slugs) {
    const outDir = join(DIST, 'blog', slug);
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, 'index.html'), html);
    count++;
  }
}

posts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
writeFileSync(join(DIST, 'sitemap.xml'), buildSitemap(posts));
writeFileSync(join(DIST, 'rss.xml'), buildRss(posts));

console.log(
  `prerender-og: wrote ${count} blog OG page(s) from ${files.length} post(s), sitemap.xml (${posts.length + 4} urls), rss.xml.`,
);
