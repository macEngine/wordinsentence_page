import { useMemo } from 'react';
import { useLocale } from '../hooks/useLocale';
import type { WordPost } from '../core/wordPost';
import { sortWordsByDate } from '../core/words';
import { PostList } from './PostList';

interface TagPageProps {
  tag: string;
  posts: WordPost[];
  onBack: () => void;
  onOpen: (post: WordPost) => void;
}

/** V2EX-style /tag/<tag> page: breadcrumb header, then every post with that tag. */
export function TagPage({ tag, posts, onBack, onOpen }: TagPageProps) {
  const { t } = useLocale();
  const shown = useMemo(
    () => sortWordsByDate(posts.filter((p) => (p.tags ?? []).includes(tag))),
    [posts, tag]
  );
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 sm:py-6">
      <div className="mx-auto max-w-[960px] rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
        <nav className="flex items-center gap-1.5 border-b border-[var(--color-border)] px-4 py-2.5 text-sm">
          <button
            onClick={onBack}
            className="text-[var(--color-muted)] hover:text-[var(--color-text)] hover:underline"
          >
            {t('articles')}
          </button>
          <span aria-hidden className="text-[var(--color-muted)]">
            ›
          </span>
          <span className="font-medium">{tag}</span>
        </nav>
        <div className="px-3">
          <PostList posts={shown} onOpen={onOpen} emptyText={t('noWords')} />
        </div>
        <div className="border-t border-[var(--color-border)] px-4 py-2.5 text-xs text-[var(--color-muted)]">
          {shown.length} {t('articlesCount')}
        </div>
      </div>
    </div>
  );
}
