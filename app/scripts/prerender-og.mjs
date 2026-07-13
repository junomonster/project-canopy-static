// Build-time OG prerender.
//
// Social/link crawlers (KakaoTalk, Slack, Twitter, Facebook, …) read raw HTML
// without executing JS, so a client-rendered SPA can only expose one set of
// OG tags (the ones baked into index.html). This script runs after `vite build`
// and emits a per-post static HTML file — dist/blog/<slug>/index.html — with
// title/description/OG/Twitter/canonical derived from each post's frontmatter.
// Cloudflare's asset server returns that file for /blog/<slug>, so crawlers get
// per-post previews while users still get the SPA.

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
  return html;
}

// --- run ---
const template = readFileSync(join(DIST, 'index.html'), 'utf8');
const files = readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.md'));

let count = 0;
for (const file of files) {
  const fm = parseFrontmatter(readFileSync(join(CONTENT_DIR, file), 'utf8'));
  const canonicalSlug = fm.slug || file.replace(/\.md$/, '');
  const post = {
    canonicalSlug,
    title: fm.title || canonicalSlug,
    description: fm.description || '',
    date: fm.date || '',
    ogImage: ogImageFor(fm),
  };
  const html = buildHtml(template, post);

  const slugs = [canonicalSlug, ...(Array.isArray(fm.aliases) ? fm.aliases : [])];
  for (const slug of slugs) {
    const outDir = join(DIST, 'blog', slug);
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, 'index.html'), html);
    count++;
  }
}

console.log(`prerender-og: wrote ${count} blog OG page(s) from ${files.length} post(s).`);
