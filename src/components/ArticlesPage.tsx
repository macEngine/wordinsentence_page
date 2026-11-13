import { useMemo, useState, type ReactNode } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
import { sortWordsByDate, wordKey } from '../core/words';

interface ArticlesPageProps {
  posts: WordPost[];
  onBack: () => void;
  /** Open the word's row in the home-page Word List. */
  onOpenWord: (key: string) => void;
}

const PILL_ON = 'bg-[var(--color-accent)] text-[var(--color-on-accent)]';
const PILL_OFF = 'text-[var(--color-muted)] hover:text-[var(--color-text)]';
const CHIP_ON =
  'border-transparent bg-[var(--color-accent)] text-[var(--color-on-accent)]';
const CHIP_OFF =
  'border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-text)]';

/**
 * Element styles for the rendered post. Tailwind v4 has no typography plugin
 * in this project, so each element is mapped explicitly; the markdown is our
 * own posts (no raw HTML is rendered by react-markdown by default).
 */
const markdownComponents = {
  h2: ({ children }: { children?: ReactNode }) => (
    <h3 className="mt-6 mb-2 text-base font-bold first:mt-0">{children}</h3>
  ),
  h3: ({ children }: { children?: ReactNode }) => (
    <h4 className="mt-4 mb-1.5 text-sm font-bold">{children}</h4>
  ),
  p: ({ children }: { children?: ReactNode }) => (
    <p className="my-2 text-sm leading-relaxed">{children}</p>
  ),
  strong: ({ children }: { children?: ReactNode }) => (
    <strong className="font-semibold text-[var(--color-text)]">
      {children}
    </strong>
  ),
  blockquote: ({ children }: { children?: ReactNode }) => (
    <blockquote className="my-3 border-l-2 border-[var(--color-accent)] bg-[var(--color-accent)]/5 px-3 py-1 text-sm leading-relaxed">
      {children}
    </blockquote>
  ),
  ul: ({ children }: { children?: ReactNode }) => (
    <ul className="my-2 list-disc space-y-0.5 pl-5 text-sm">{children}</ul>
  ),
  ol: ({ children }: { children?: ReactNode }) => (
    <ol className="my-2 list-decimal space-y-0.5 pl-5 text-sm">{children}</ol>
  ),
  code: ({ children }: { children?: ReactNode }) => (
    <code className="rounded-full border border-[var(--color-border)] px-2 py-0.5 font-sans text-xs text-[var(--color-muted)]">
      {children}
    </code>
  ),
  a: ({ href, children }: { href?: string; children?: ReactNode }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[var(--color-accent)] underline underline-offset-2"
    >
      {children}
    </a>
  ),
  img: ({ src, alt }: { src?: string; alt?: string }) => (
    <img
      src={src}
      alt={alt ?? ''}
      loading="lazy"
      className="my-3 max-h-80 rounded-lg border border-[var(--color-border)]"
    />
  ),
  table: ({ children }: { children?: ReactNode }) => (
    <div className="my-3 overflow-x-auto">
      <table className="w-full text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }: { children?: ReactNode }) => (
    <thead className="border-b border-[var(--color-border)] text-left text-xs text-[var(--color-muted)]">
      {children}
    </thead>
  ),
  th: ({ children }: { children?: ReactNode }) => (
    <th className="py-1.5 pr-3 font-medium">{children}</th>
  ),
  td: ({ children }: { children?: ReactNode }) => (
    <td className="border-b border-[var(--color-border)]/30 py-1.5 pr-3 align-top">
      {children}
    </td>
  ),
};

function Label({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] tracking-wider text-[var(--color-muted)] uppercase">
      {children}
    </p>
  );
}

export function ArticlesPage({ posts, onBack, onOpenWord }: ArticlesPageProps) {
  const { t, locale } = useLocale();
  const [filter, setFilter] = useState<ArticleFilter>(ALL_ARTICLES_FILTER);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const years = useMemo(() => collectYears(posts), [posts]);
  const sources = useMemo(() => collectSources(posts), [posts]);
  const allTags = useMemo(() => collectTags(posts), [posts]);
  const shown = useMemo(
    () => sortWordsByDate(filterArticles(posts, filter)),
    [posts, filter]
  );
  const selected =
    shown.find((p) => wordKey(p) === selectedKey) ?? shown[0] ?? null;

  const change = (next: Partial<ArticleFilter>) => {
    setFilter((f) => ({ ...f, ...next }));
    setSelectedKey(null);
  };
  const hasFilter =
    filter.query !== '' || filter.tags.length > 0 || filter.source !== null;

  const dateLabel = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString(
      locale === 'zh' ? 'zh-CN' : 'en-US',
      { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' }
    );

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

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_340px]">
        {/* Left: filters + rendered posts */}
        <div className="min-w-0">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
            {/* Year pills + source filter */}
            <div className="mb-4 flex flex-wrap items-center gap-1.5 border-b border-[var(--color-border)] pb-3">
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
            <div className="mb-4 flex flex-col gap-1.5">
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
                    onClick={() =>
                      change({ query: '', tags: [], source: null })
                    }
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

            {/* Posts */}
            {shown.length === 0 ? (
              <p className="py-10 text-center text-sm text-[var(--color-muted)]">
                {t('noWords')}
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {shown.map((post) => {
                  const key = wordKey(post);
                  const isSelected =
                    selected !== null && wordKey(selected) === key;
                  return (
                    <article
                      key={key}
                      aria-current={isSelected ? 'true' : undefined}
                      onClick={() => setSelectedKey(key)}
                      className={`rounded-xl border p-4 transition-colors sm:p-5 ${
                        isSelected
                          ? 'border-[var(--color-accent)]/60 bg-[var(--color-bg)]'
                          : 'border-[var(--color-border)] hover:border-[var(--color-accent)]/40'
                      }`}
                    >
                      <header className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                        <h2 className="text-xl font-bold">
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              onOpenWord(key);
                            }}
                            title={t('openWordDetail')}
                            className="font-mono hover:text-[var(--color-accent)] hover:underline"
                          >
                            {post.word}
                          </button>
                        </h2>
                        <span className="text-xs text-[var(--color-muted)]">
                          {post.date}
                          {post.source ? ` · ${post.source}` : ''}
                        </span>
                      </header>
                      <Markdown
                        remarkPlugins={[remarkGfm]}
                        components={markdownComponents}
                      >
                        {post.markdown}
                      </Markdown>
                    </article>
                  );
                })}
              </div>
            )}

            <div className="mt-4 flex items-center justify-between border-t border-[var(--color-border)] pt-3 text-xs text-[var(--color-muted)]">
              <span>
                {shown.length} {t('articlesCount')}
              </span>
            </div>
          </div>
        </div>
        {/* Right: focus + selected word (sticky sidebar) */}
        <div className="order-first flex flex-col gap-4 lg:sticky lg:top-24 lg:order-none">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
            <Label>{t('date')}</Label>
            <p className="min-h-[1.75rem] font-mono text-lg font-bold">
              {selected ? dateLabel(selected.date) : '\u00a0'}
            </p>
            <Label>
              <span className="mt-3 block">{t('source')}</span>
            </Label>
            <p className="min-h-[1.25rem] truncate text-sm">
              {selected?.sourceDetail ?? selected?.source ?? '\u00a0'}
            </p>
          </div>

          {selected && (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3">
              <Label>{t('selectedWord')}</Label>
              <button
                onClick={() => onOpenWord(wordKey(selected))}
                className="mt-1 block font-mono text-lg font-bold text-[var(--color-accent)] hover:underline"
                title={t('openWordDetail')}
              >
                {selected.word} →
              </button>
              {(selected.phoneticUk || selected.phoneticUs) && (
                <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                  {selected.phoneticUk && <span>英 {selected.phoneticUk}</span>}
                  {selected.phoneticUk && selected.phoneticUs && ' '}
                  {selected.phoneticUs && <span>美 {selected.phoneticUs}</span>}
                </p>
              )}
              {selected.meaning && (
                <p className="mt-2 text-xs leading-relaxed">
                  {selected.meaning}
                </p>
              )}
              {selected.tags && selected.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {selected.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-[var(--color-border)] px-2 py-0.5 text-[10px] text-[var(--color-muted)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
