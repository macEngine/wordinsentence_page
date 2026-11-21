import { useMemo, useRef, useState } from 'react';
import { useLocale } from '../hooks/useLocale';
import type { WordPostSummary } from '../core/articleIndex';
import { paginate, sortWordsByDate } from '../core/words';
import { LIST_PAGE_SIZE } from '../core/pager';
import { Pager } from './Pager';
import { PostList } from './PostList';

interface TagPageProps {
  tag: string;
  posts: WordPostSummary[];
  onBack: () => void;
  onOpen: (post: WordPostSummary) => void;
}

/** V2EX-style /tag/<tag> page: breadcrumb header, then every post with that tag. */
export function TagPage({ tag, posts, onBack, onOpen }: TagPageProps) {
  const { t } = useLocale();
  const shown = useMemo(
    () => sortWordsByDate(posts.filter((p) => (p.tags ?? []).includes(tag))),
    [posts, tag]
  );
  const [page, setPage] = useState(0);
  const listTopRef = useRef<HTMLDivElement>(null);
  const slice = useMemo(
    () => paginate(shown, page, LIST_PAGE_SIZE),
    [shown, page]
  );
  const goTo = (next: number) => {
    setPage(next);
    listTopRef.current?.scrollIntoView({ block: 'start' });
  };
  return (
    <div className="mx-auto max-w-[1248px] px-4 py-5 sm:px-6 sm:py-6">
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
        <div ref={listTopRef} className="scroll-mt-[var(--header-offset)] px-3">
          <PostList
            posts={slice.items}
            onOpen={onOpen}
            emptyText={t('noWords')}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--color-border)] px-4 py-2 text-xs text-[var(--color-muted)]">
          <span>
            {shown.length} {t('articlesCount')}
          </span>
          <Pager
            page={slice.page}
            totalPages={slice.totalPages}
            onChange={goTo}
          />
        </div>
      </div>
    </div>
  );
}
