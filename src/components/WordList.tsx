import { useMemo, useState } from 'react';
import { useLocale } from '../hooks/useLocale';
import {
  ALL_WORDS_FILTER,
  collectSources,
  collectTags,
  filterWords,
  paginate,
  sortWordsByDate,
  type WordFilter,
} from '../core/words';
import type { WordPost } from '../core/wordPost';
import { PostList } from './PostList';

interface WordListProps {
  words: WordPost[];
  /** Open the article detail page for a word. */
  onOpen: (post: WordPost) => void;
}

const PILL_ON = 'bg-[var(--color-accent)] text-[var(--color-on-accent)]';
const PILL_OFF =
  'bg-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-text)]';

function Pill({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-medium ${active ? PILL_ON : PILL_OFF}`}
    >
      {label}
    </button>
  );
}

/**
 * Replaces running_page's ActivityLog: same card, pill rows and pagination,
 * but the body is a V2EX-style topic list (PostList) and a row opens the
 * article detail page. Pill rows come from the data (source, tag).
 */
export function WordList({ words, onOpen }: WordListProps) {
  const { t } = useLocale();
  const [filter, setFilter] = useState<WordFilter>(ALL_WORDS_FILTER);
  const [page, setPage] = useState(0);

  const sources = useMemo(() => collectSources(words), [words]);
  const tags = useMemo(() => collectTags(words), [words]);
  const sorted = useMemo(
    () => sortWordsByDate(filterWords(words, filter)),
    [words, filter]
  );
  const slice = paginate(sorted, page);

  const changeFilter = (next: WordFilter) => {
    setFilter(next);
    setPage(0);
  };

  return (
    <div
      aria-label={t('wordList')}
      role="region"
      className="activity-log-card rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 sm:p-6"
    >
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold">{t('wordList')}</h2>
        <span className="text-sm text-[var(--color-muted)]">
          {t('showing')} {slice.from}-{slice.to} {t('of')} {sorted.length}
        </span>
      </div>

      {/* Source pills */}
      <div
        role="group"
        aria-label={t('wordSource')}
        className="mb-3 flex flex-wrap items-center gap-2"
      >
        <Pill
          active={filter.source === null}
          label={t('all')}
          onClick={() => changeFilter({ ...filter, source: null })}
        />
        {sources.map((s) => (
          <Pill
            key={s}
            active={filter.source === s}
            label={s}
            onClick={() => changeFilter({ ...filter, source: s })}
          />
        ))}
      </div>

      {/* Tag pills */}
      {tags.length > 0 && (
        <div
          role="group"
          aria-label={t('wordTag')}
          className="mb-5 flex flex-wrap items-center gap-2"
        >
          <Pill
            active={filter.tag === null}
            label={t('all')}
            onClick={() => changeFilter({ ...filter, tag: null })}
          />
          {tags.map((tag) => (
            <Pill
              key={tag}
              active={filter.tag === tag}
              label={tag}
              onClick={() => changeFilter({ ...filter, tag })}
            />
          ))}
        </div>
      )}

      <PostList posts={slice.items} onOpen={onOpen} emptyText={t('noWords')} />

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between border-t border-[var(--color-border)] pt-4">
        <button
          aria-label={t('prevWordsPage')}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={slice.page === 0}
          className="text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)] disabled:opacity-30"
        >
          ←
        </button>
        <span className="text-sm text-[var(--color-muted)]">
          {t('page')} {slice.totalPages ? slice.page + 1 : 0} {t('pageOf')}{' '}
          {slice.totalPages} {t('pages')}
        </span>
        <button
          aria-label={t('nextWordsPage')}
          onClick={() => setPage((p) => Math.min(slice.totalPages - 1, p + 1))}
          disabled={slice.page >= slice.totalPages - 1}
          className="text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)] disabled:opacity-30"
        >
          →
        </button>
      </div>
    </div>
  );
}
