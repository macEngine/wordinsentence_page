import { useEffect, useState } from 'react';
import type { WordPost } from '../core/wordPost';

const cache = new Map<string, WordPost>();

/** Where `scripts/build-words.ts` writes one JSON per article (under public/). */
export function articleUrl(slug: string): string {
  return `${import.meta.env.BASE_URL}data/articles/${encodeURIComponent(slug)}.json`;
}

interface Loaded {
  slug: string;
  post?: WordPost;
  error?: string;
}

export interface ArticleState {
  post?: WordPost;
  loading: boolean;
  error?: string;
}

/** Fetches the full post for `slug` (body markdown, 解析, 近义词…), cached per session. */
export function useArticle(slug: string): ArticleState {
  // Keyed by slug so a stale result for the previous article is never shown.
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  useEffect(() => {
    if (cache.has(slug)) return;
    const controller = new AbortController();
    fetch(articleUrl(slug), { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<WordPost>;
      })
      .then((post) => {
        cache.set(slug, post);
        setLoaded({ slug, post });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setLoaded({ slug, error: (err as Error).message });
      });
    return () => controller.abort();
  }, [slug]);

  const cached = cache.get(slug);
  if (cached) return { post: cached, loading: false };
  if (loaded?.slug === slug)
    return { post: loaded.post, loading: false, error: loaded.error };
  return { loading: true };
}
