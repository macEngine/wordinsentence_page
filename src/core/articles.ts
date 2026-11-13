/**
 * Pure logic behind the Articles page (one card per blog post).
 * Framework-free; tested by tests/articles.test.ts.
 */
import type { WordPost } from './wordPost.ts';
import { collectSources, collectTags } from './words.ts';

export interface ArticleFilter {
  /** `null` = all years. */
  year: number | null;
  /** `null` = all sources. */
  source: string | null;
  /** Every active tag must be present (AND), like the tracks page. */
  tags: string[];
  /** Space-separated terms; every term must match somewhere (AND). */
  query: string;
}

export const ALL_ARTICLES_FILTER: ArticleFilter = {
  year: null,
  source: null,
  tags: [],
  query: '',
};

export function articleYear(post: WordPost): number {
  return Number(post.date.slice(0, 4));
}

/** Distinct years, newest first. */
export function collectYears(posts: WordPost[]): number[] {
  return [...new Set(posts.map(articleYear))].sort((a, b) => b - a);
}

export { collectSources, collectTags };

export function queryTerms(query: string): string[] {
  return query
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

/** Text a search term is matched against. Not the full markdown on purpose: searching the 解析 prose makes every word match everything. */
function haystack(post: WordPost): string {
  return [
    post.word,
    post.source ?? '',
    ...(post.tags ?? []),
    post.sentence,
    post.translation ?? '',
    post.meaning ?? '',
    ...(post.synonyms ?? []).map((s) => s.word),
  ]
    .join('\n')
    .toLowerCase();
}

export function filterArticles(
  posts: WordPost[],
  filter: ArticleFilter
): WordPost[] {
  const terms = queryTerms(filter.query);
  return posts.filter((p) => {
    if (filter.year !== null && articleYear(p) !== filter.year) return false;
    if (filter.source !== null && (p.source?.trim() ?? '') !== filter.source) {
      return false;
    }
    const tags = p.tags ?? [];
    if (!filter.tags.every((t) => tags.includes(t))) return false;
    if (terms.length) {
      const text = haystack(p);
      if (!terms.every((t) => text.includes(t))) return false;
    }
    return true;
  });
}

/** URL slug for a post: `2026-07-07-wrangling`. */
export function postSlug(post: WordPost): string {
  const word = post.word
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${post.date}-${word}`;
}

export function findBySlug(
  posts: WordPost[],
  slug: string
): WordPost | undefined {
  return posts.find((p) => postSlug(p) === slug);
}

export interface ArticleSection {
  /** Heading text with its emoji, e.g. "📰 今日例句". */
  title: string;
  /** Markdown body of the section. */
  body: string;
}

/**
 * Split a post into its `## ` sections so the detail page can show each in
 * its own box (V2EX-style: topic box, then one box per block). Text before
 * the first heading, if any, becomes an untitled first section.
 */
export function splitArticle(markdown: string): ArticleSection[] {
  const sections: ArticleSection[] = [];
  const re = /^##\s+(.+)$/gm;
  let last: ArticleSection | null = null;
  let cursor = 0;
  for (const m of markdown.matchAll(re)) {
    const start = m.index ?? 0;
    const before = markdown.slice(cursor, start).trim();
    if (last) last.body = before;
    else if (before) sections.push({ title: '', body: before });
    last = { title: m[1].trim(), body: '' };
    sections.push(last);
    cursor = start + m[0].length;
  }
  const tail = markdown.slice(cursor).trim();
  if (last) last.body = tail;
  else if (tail) sections.push({ title: '', body: tail });
  return sections;
}

/** Toggle one tag in a multi-select list. */
export function toggleTag(tags: string[], tag: string): string[] {
  return tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag];
}
