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

/** Toggle one tag in a multi-select list. */
export function toggleTag(tags: string[], tag: string): string[] {
  return tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag];
}
