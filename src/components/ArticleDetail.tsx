import type { ReactNode } from 'react';
import { useLocale } from '../hooks/useLocale';
import type { WordPost } from '../core/wordPost';
import { PostMarkdown } from './PostMarkdown';

interface ArticleDetailProps {
  post: WordPost;
  /** Posts in display order, for prev / next. */
  posts: WordPost[];
  onBack: () => void;
  onOpen: (post: WordPost) => void;
}

const BOX =
  'rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]';

/** Sidebar box with a narrow "→ Title" header bar. */
function SideCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className={BOX}>
      <h2 className="border-b border-[var(--color-border)] px-3 py-1.5 text-sm font-semibold">
        <span aria-hidden className="mr-1.5 text-[var(--color-accent)]">
          →
        </span>
        {title}
      </h2>
      <div className="px-3 py-2.5">{children}</div>
    </div>
  );
}

/**
 * V2EX-style topic page: breadcrumb + title box, then the whole post in one
 * box, with a sticky sidebar for date / source / synonyms.
 */
export function ArticleDetail({
  post,
  posts,
  onBack,
  onOpen,
}: ArticleDetailProps) {
  const { t, locale } = useLocale();
  const idx = posts.indexOf(post);
  const newer = idx > 0 ? posts[idx - 1] : null;
  const older = idx >= 0 && idx < posts.length - 1 ? posts[idx + 1] : null;
  const dateLabel = new Date(`${post.date}T00:00:00`).toLocaleDateString(
    locale === 'zh' ? 'zh-CN' : 'en-US',
    { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' }
  );

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 sm:py-6">
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_340px]">
        {/* Main column */}
        <div className="flex min-w-0 flex-col gap-4">
          {/* Topic box */}
          <div className={`${BOX} p-4 sm:p-6`}>
            <nav className="mb-2 flex items-center gap-1.5 text-sm text-[var(--color-muted)]">
              <button
                onClick={onBack}
                className="hover:text-[var(--color-text)] hover:underline"
              >
                {t('articles')}
              </button>
              {post.source && (
                <>
                  <span aria-hidden>›</span>
                  <span>{post.source}</span>
                </>
              )}
            </nav>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="font-mono text-2xl font-bold sm:text-3xl">
                  {post.word}
                </h1>
                {(post.phoneticUk || post.phoneticUs) && (
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    {post.phoneticUk && <span>英 {post.phoneticUk}</span>}
                    {post.phoneticUk && post.phoneticUs && ' '}
                    {post.phoneticUs && <span>美 {post.phoneticUs}</span>}
                  </p>
                )}
                <p className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-[var(--color-muted)]">
                  <span>{post.date}</span>
                  {(post.tags ?? []).map((tag) => (
                    <span
                      key={tag}
                      className="rounded border border-[var(--color-border)] bg-[var(--color-bg)] px-1.5 py-0.5"
                    >
                      {tag}
                    </span>
                  ))}
                </p>
              </div>
              {post.image && (
                <img
                  src={post.image}
                  alt=""
                  className="hidden h-20 w-20 shrink-0 rounded-lg border border-[var(--color-border)] object-cover sm:block"
                />
              )}
            </div>
            {post.meaning && (
              <p className="mt-4 border-t border-[var(--color-border)] pt-3 text-sm leading-relaxed">
                {post.meaning}
              </p>
            )}

            {/* The whole post, in the same box */}
            <article className="mt-4 border-t border-[var(--color-border)] pt-4">
              <PostMarkdown>{post.markdown}</PostMarkdown>
            </article>
          </div>

          {/* Prev / next */}
          <div className="flex items-center justify-between text-sm">
            {newer ? (
              <button
                onClick={() => onOpen(newer)}
                className="text-[var(--color-muted)] hover:text-[var(--color-text)]"
              >
                ← <span className="font-mono">{newer.word}</span>
              </button>
            ) : (
              <span />
            )}
            {older ? (
              <button
                onClick={() => onOpen(older)}
                className="text-[var(--color-muted)] hover:text-[var(--color-text)]"
              >
                <span className="font-mono">{older.word}</span> →
              </button>
            ) : (
              <span />
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="order-first flex flex-col gap-4 lg:sticky lg:top-[var(--header-offset)] lg:order-none">
          <SideCard title={t('date')}>
            <p className="font-mono text-base font-bold">{dateLabel}</p>
          </SideCard>
          <SideCard title={t('source')}>
            <p className="text-sm leading-relaxed">
              {post.sourceDetail ?? post.source ?? '\u00a0'}
            </p>
          </SideCard>
          {post.synonyms && post.synonyms.length > 0 && (
            <SideCard title={locale === 'zh' ? '近义词' : 'Synonyms'}>
              <ul className="space-y-1 text-xs">
                {post.synonyms
                  .filter((s) => s.word !== post.word)
                  .map((s) => (
                    <li key={s.word} className="flex gap-2">
                      <span className="shrink-0 font-mono font-medium">
                        {s.word}
                      </span>
                      <span className="text-[var(--color-muted)]">
                        {s.nuance}
                      </span>
                    </li>
                  ))}
              </ul>
            </SideCard>
          )}
        </div>
      </div>
    </div>
  );
}
