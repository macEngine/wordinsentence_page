import { useMemo, useState } from 'react';
import { useLocale } from '../hooks/useLocale';
import type { WordPost } from '../core/wordPost';
import {
  ALL_ARTICLES_FILTER,
  collectSources,
  collectTags,
  collectYears,
  filterArticles,
  toggleTag,
  type ArticleFilter,
} from '../core/articles';
import { sortWordsByDate } from '../core/words';
import { PostList } from './PostList';

interface ArticlesPageProps {
  posts: WordPost[];
  onBack: () => void;
  onOpen: (post: WordPost) => void;
}

const PILL_ON = 'bg-[var(--color-accent)] text-[var(--color-on-accent)]';
const PILL_OFF = 'text-[var(--color-muted)] hover:text-[var(--color-text)]';
const CHIP_ON =
  'border-transparent bg-[var(--color-accent)] text-[var(--color-on-accent)]';
const CHIP_OFF =
  'border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-text)]';

/**
 * Articles index, V2EX-style: a filter bar (years, sources, search, tags)
 * above a topic list. Clicking a row opens the article detail page.
 */
export function ArticlesPage({ posts, onBack, onOpen }: ArticlesPageProps) {
  const { t } = useLocale();
  const [filter, setFilter] = useState<ArticleFilter>(ALL_ARTICLES_FILTER);

  const years = useMemo(() => collectYears(posts), [posts]);
  const sources = useMemo(() => collectSources(posts), [posts]);
  const allTags = useMemo(() => collectTags(posts), [posts]);
  const shown = useMemo(
    () => sortWordsByDate(filterArticles(posts, filter)),
    [posts, filter]
  );
  const change = (next: Partial<ArticleFilter>) =>
    setFilter((f) => ({ ...f, ...next }));
  const hasFilter =
    filter.query !== '' || filter.tags.length > 0 || filter.source !== null;

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 sm:py-6">
      {/* Top bar: back + title */}
      <div className="mb-5 flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex shrink-0 items-center gap-1.5 text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          {t('back')}
        </button>
        <h1 className="shrink-0 text-lg font-bold">{t('articles')}</h1>
      </div>

      <div className="mx-auto max-w-[960px] rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
        {/* Tab bar: years left, sources right */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-[var(--color-border)] px-4 py-3">
          <button
            aria-pressed={filter.year === null}
            onClick={() => change({ year: null })}
            className={`rounded-full px-3 py-1 text-xs font-medium ${filter.year === null ? PILL_ON : PILL_OFF}`}
          >
            {t('all')}
          </button>
          {years.map((yr) => (
            <button
              key={yr}
              aria-pressed={filter.year === yr}
              onClick={() => change({ year: yr })}
              className={`rounded-full px-3 py-1 text-xs font-medium ${filter.year === yr ? PILL_ON : PILL_OFF}`}
            >
              {yr}
            </button>
          ))}
          <div
            role="group"
            aria-label={t('wordSource')}
            className="ml-auto flex flex-wrap items-center gap-1.5"
          >
            <button
              aria-pressed={filter.source === null}
              onClick={() => change({ source: null })}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${filter.source === null ? CHIP_ON : CHIP_OFF}`}
            >
              {t('all')}
            </button>
            {sources.map((s) => (
              <button
                key={s}
                aria-pressed={filter.source === s}
                onClick={() => change({ source: s })}
                className={`rounded-full border px-3 py-1 text-xs font-medium ${filter.source === s ? CHIP_ON : CHIP_OFF}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Search + tag chips */}
        <div className="flex flex-col gap-1.5 border-b border-[var(--color-border)] px-4 py-3">
          <div className="flex items-center gap-1.5">
            <input
              type="search"
              value={filter.query}
              onChange={(e) => change({ query: e.target.value })}
              placeholder={t('searchArticles')}
              aria-label={t('searchArticles')}
              className="min-w-0 flex-1 rounded-full border border-[var(--color-border)] bg-transparent px-3 py-1 text-xs text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:outline-none"
            />
            {hasFilter && (
              <button
                onClick={() => change({ query: '', tags: [], source: null })}
                className="rounded-full px-2 py-1 text-xs font-medium text-[var(--color-muted)] hover:text-[var(--color-text)]"
              >
                {t('clear')}
              </button>
            )}
          </div>
          {allTags.length > 0 && (
            <div
              role="group"
              aria-label={t('wordTag')}
              className="flex flex-wrap items-center gap-1.5"
            >
              {allTags.map((tag) => {
                const on = filter.tags.includes(tag);
                return (
                  <button
                    key={tag}
                    aria-pressed={on}
                    onClick={() =>
                      change({ tags: toggleTag(filter.tags, tag) })
                    }
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${on ? CHIP_ON : CHIP_OFF}`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          )}
        </div>

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
