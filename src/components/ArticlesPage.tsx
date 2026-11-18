import { useMemo, useState } from 'react';
import { isWordTag } from '../core/lexicon';
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
import { collectWordIndex, type LexiconEntry } from '../core/lexicon';
import { HOME_SIDEBAR } from '../core/siteSidebar';
import { PostList } from './PostList';
import { PostMarkdown } from './PostMarkdown';
import { BOX, SideCard } from './SideCard';

interface ArticlesPageProps {
  posts: WordPost[];
  lexicon: LexiconEntry[];
  onOpen: (post: WordPost) => void;
  onOpenWords: () => void;
}

const PILL_ON = 'bg-[var(--color-accent)] text-[var(--color-on-accent)]';
const PILL_OFF = 'text-[var(--color-muted)] hover:text-[var(--color-text)]';
const CHIP_ON =
  'border-transparent bg-[var(--color-accent)] text-[var(--color-on-accent)]';
const CHIP_OFF =
  'border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-text)]';

/**
 * The home page. Left: the articles index, V2EX-style — a filter bar (years,
 * sources, search, tags) above a topic list; a row opens the article. Right:
 * the owner's cards (src/core/siteSidebar.ts) plus a small stats card.
 */
export function ArticlesPage({
  posts,
  lexicon,
  onOpen,
  onOpenWords,
}: ArticlesPageProps) {
  const { t, locale } = useLocale();
  const wordCount = useMemo(
    () => collectWordIndex(posts, lexicon).length,
    [posts, lexicon]
  );
  const [filter, setFilter] = useState<ArticleFilter>(ALL_ARTICLES_FILTER);

  const years = useMemo(() => collectYears(posts), [posts]);
  const sources = useMemo(() => collectSources(posts), [posts]);
  // Word tags (stark, glare…) are not filters; they open the word page.
  const allTags = useMemo(
    () => collectTags(posts).filter((tag) => !isWordTag(tag)),
    [posts]
  );
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
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_340px]">
        <div className={BOX}>
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

        {/* Sidebar: right column on desktop, below the list on phones */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-[var(--header-offset)]">
          {HOME_SIDEBAR.map((card) => (
            <SideCard
              key={card.zh}
              title={locale === 'zh' ? card.zh : (card.en ?? card.zh)}
            >
              <PostMarkdown>{card.markdown}</PostMarkdown>
            </SideCard>
          ))}
          <SideCard title={t('stats')}>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-xs text-[var(--color-muted)]">
                  {t('articles')}
                </dt>
                <dd className="font-mono text-lg font-bold">{posts.length}</dd>
              </div>
              <button onClick={onOpenWords} className="text-left">
                <dt className="text-xs text-[var(--color-muted)] underline-offset-2 hover:underline">
                  {t('words')}
                </dt>
                <dd className="font-mono text-lg font-bold">{wordCount}</dd>
              </button>
            </dl>
          </SideCard>
        </div>
      </div>
    </div>
  );
}
