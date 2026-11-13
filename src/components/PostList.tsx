import { useLocale } from '../hooks/useLocale';
import type { WordPost } from '../core/wordPost';
import { postSlug } from '../core/articles';
import { stripBold, truncateSentence } from '../core/words';

interface PostListProps {
  posts: WordPost[];
  onOpen: (post: WordPost) => void;
  /** Shown when `posts` is empty. */
  emptyText: string;
}

/** 48px thumbnail: the 词汇卡片 image, or the word's first letter. */
function Thumb({ post }: { post: WordPost }) {
  if (post.image) {
    return (
      <img
        src={post.image}
        alt=""
        loading="lazy"
        className="h-12 w-12 shrink-0 rounded-md border border-[var(--color-border)] object-cover"
      />
    );
  }
  return (
    <div
      aria-hidden
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-[var(--color-accent)]/15 font-mono text-xl font-bold text-[var(--color-accent)]"
    >
      {post.word.slice(0, 1).toUpperCase()}
    </div>
  );
}

/**
 * V2EX-style topic list: thumbnail, title, meta line, grey pill on the right.
 * Shared by the home-page Word List card and the Articles page.
 */
export function PostList({ posts, onOpen, emptyText }: PostListProps) {
  const { t } = useLocale();
  if (!posts.length) {
    return (
      <p className="py-10 text-center text-sm text-[var(--color-muted)]">
        {emptyText}
      </p>
    );
  }
  return (
    <ul className="divide-y divide-[var(--color-border)]/60">
      {posts.map((post) => {
        const slug = postSlug(post);
        return (
          <li key={slug}>
            <a
              href={`${import.meta.env.BASE_URL}articles/${slug}`}
              onClick={(event) => {
                if (
                  event.defaultPrevented ||
                  event.button !== 0 ||
                  event.metaKey ||
                  event.ctrlKey ||
                  event.shiftKey ||
                  event.altKey
                ) {
                  return; // let the browser open in a new tab
                }
                event.preventDefault();
                onOpen(post);
              }}
              className="flex items-start gap-3 px-1 py-3 transition-colors hover:bg-[var(--color-bg)] sm:gap-4"
            >
              <Thumb post={post} />
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-base font-medium text-[var(--color-text)]">
                  <span className="font-mono">{post.word}</span>
                  {post.meaning && (
                    <span className="ml-2 text-sm font-normal text-[var(--color-muted)]">
                      {truncateSentence(post.meaning, 40)}
                    </span>
                  )}
                </h3>
                <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-[var(--color-muted)]">
                  {(post.tags ?? []).map((tag) => (
                    <span
                      key={tag}
                      className="rounded border border-[var(--color-border)] bg-[var(--color-bg)] px-1.5 py-0.5"
                    >
                      {tag}
                    </span>
                  ))}
                  {post.source && (
                    <>
                      <span aria-hidden>•</span>
                      <span className="font-medium text-[var(--color-text)]/80">
                        {post.source}
                      </span>
                    </>
                  )}
                  <span aria-hidden>•</span>
                  <span className="truncate">
                    {truncateSentence(stripBold(post.sentence), 60)}
                  </span>
                </p>
              </div>
              <span
                className="mt-1 shrink-0 rounded-full bg-[var(--color-border)] px-2.5 py-0.5 font-mono text-xs text-[var(--color-muted)]"
                title={t('date')}
              >
                {post.date}
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
