// Blog content loader.
//
// Drop a Markdown file into src/content/blog/<slug>.md with frontmatter and it
// is automatically picked up here at build time. Co-locate images under
// public/blog/<slug>/ and reference them with absolute paths, e.g.
// ![alt](/blog/<slug>/image1.png).

import GithubSlugger from 'github-slugger';

export interface PostMeta {
  slug: string;
  title: string;
  description: string;
  date: string; // ISO (YYYY-MM-DD)
  author?: string;
  tags: string[];
  cover?: string;
  readingMinutes: number;
  aliases: string[]; // extra slugs that also resolve to this post
}

export interface Post extends PostMeta {
  body: string; // markdown without frontmatter
}

export interface TocItem {
  depth: number; // 2 | 3
  text: string;
  id: string;
}

const raw = import.meta.glob('../content/blog/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function parseFrontmatter(source: string): {
  data: Record<string, unknown>;
  body: string;
} {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(source);
  if (!match) return { data: {}, body: source };

  const data: Record<string, unknown> = {};
  const lines = match[1].split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();

    // Block scalar: `key: |` (literal, keep newlines) or `key: >` (folded).
    // Consume the following indented lines as the value.
    if (value === '|' || value === '>' || value === '|-' || value === '>-') {
      const literal = value.startsWith('|');
      const block: string[] = [];
      while (i + 1 < lines.length && (!lines[i + 1].trim() || /^\s/.test(lines[i + 1]))) {
        block.push(lines[++i]);
      }
      const indent = block.find((l) => l.trim())?.match(/^\s*/)?.[0].length ?? 0;
      const dedented = block.map((l) => l.slice(indent));
      data[key] = (literal ? dedented.join('\n') : dedented.join(' ')).trim();
      continue;
    }

    // Inline array: [a, b, c]
    if (value.startsWith('[') && value.endsWith(']')) {
      const inner = value.slice(1, -1).trim();
      data[key] = inner
        ? inner.split(',').map((s) => s.trim().replace(/^["']|["']$/g, ''))
        : [];
      continue;
    }

    // Quoted value that isn't closed on this line spans following lines
    // (YAML folds the breaks to spaces).
    const quote = value[0];
    if ((quote === '"' || quote === "'") && !(value.length > 1 && value.endsWith(quote))) {
      const parts = [value.slice(1)];
      while (i + 1 < lines.length && !lines[i].trimEnd().endsWith(quote)) {
        parts.push(lines[++i]);
      }
      let joined = parts.join(' ').trim();
      if (joined.endsWith(quote)) joined = joined.slice(0, -1);
      data[key] = joined.trim();
      continue;
    }

    value = value.replace(/^["']|["']$/g, '');
    data[key] = value;
  }
  return { data, body: source.slice(match[0].length) };
}

function slugFromPath(path: string): string {
  return path.split('/').pop()!.replace(/\.md$/, '');
}

function estimateReadingMinutes(body: string): number {
  // ~350 Korean chars per minute; fall back to word count for latin text.
  const chars = body.replace(/\s/g, '').length;
  return Math.max(1, Math.round(chars / 350));
}

const posts: Post[] = Object.entries(raw)
  .map(([path, source]) => {
    const { data, body } = parseFrontmatter(source);
    const slug = (data.slug as string) || slugFromPath(path);
    return {
      slug,
      title: (data.title as string) || slug,
      description: (data.description as string) || '',
      date: (data.date as string) || '',
      author: data.author as string | undefined,
      tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
      cover: data.cover as string | undefined,
      readingMinutes: estimateReadingMinutes(body),
      aliases: Array.isArray(data.aliases) ? (data.aliases as string[]) : [],
      body: body.trim(),
    };
  })
  .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

export function getAllPosts(): PostMeta[] {
  return posts.map(({ body: _body, ...meta }) => meta);
}

export function getPost(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug || p.aliases.includes(slug));
}

export function buildToc(body: string): TocItem[] {
  const items: TocItem[] = [];
  // Use the same slugger rehype-slug uses so TOC anchors match heading ids
  // exactly (including its duplicate-suffix behaviour).
  const slugger = new GithubSlugger();
  let inFence = false;

  for (const line of body.split(/\r?\n/)) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const m = /^(#{2,3})\s+(.*)$/.exec(line);
    if (!m) continue;

    const depth = m[1].length;
    // Strip inline markdown markers to match rehype-slug's text extraction.
    const text = m[2]
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .trim();

    items.push({ depth, text, id: slugger.slug(text) });
  }
  return items;
}
