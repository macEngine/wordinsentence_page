import { useMemo } from 'react';
import { useLocale } from '../hooks/useLocale';
import type { WordPost } from '../core/wordPost';
import { collectWordIndex, type LexiconEntry } from '../core/lexicon';

interface WordsPageProps {
  posts: WordPost[];
  lexicon: LexiconEntry[];
  onBack: () => void;
  onOpenWord: (word: string) => void;
}

/** /word: every word the site knows, newest example first; ● marks a hand-written entry. */
export function WordsPage({
  posts,
  lexicon,
  onBack,
  onOpenWord,
}: WordsPageProps) {
  const { t } = useLocale();
  const items = useMemo(
    () => collectWordIndex(posts, lexicon),
    [posts, lexicon]
  );
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 sm:py-6">
      <div className="mx-auto max-w-[960px] rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
        <nav className="flex items-center gap-1.5 border-b border-[var(--color-border)] px-4 py-2.5 text-sm">
          <button
            onClick={onBack}
            className="text-[var(--color-muted)] hover:text-[var(--color-text)] hover:underline"
          >
            {t('home')}
          </button>
          <span aria-hidden className="text-[var(--color-muted)]">
            ›
          </span>
          <span className="font-medium">{t('words')}</span>
        </nav>
        <ul className="divide-y divide-[var(--color-border)]">
          {items.map((item) => (
            <li key={item.word}>
              <button
                onClick={() => onOpenWord(item.word)}
                className="flex w-full items-center justify-between gap-4 px-4 py-2.5 text-left hover:bg-[var(--color-bg)]"
              >
                <span className="flex items-center gap-2 font-mono text-sm font-medium">
                  {item.word}
                  {item.hasEntry && (
                    <span
                      title={t('wordEntry')}
                      className="text-[10px] text-[var(--color-accent)]"
                    >
                      ●
                    </span>
                  )}
                </span>
                <span className="flex items-center gap-3 text-xs text-[var(--color-muted)]">
                  {item.latest && (
                    <span className="font-mono">{item.latest}</span>
                  )}
                  <span className="rounded-full bg-[var(--color-bg)] px-2 py-0.5">
                    {item.examples}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <div className="border-t border-[var(--color-border)] px-4 py-2.5 text-xs text-[var(--color-muted)]">
          {items.length} {t('wordsCount')}
        </div>
      </div>
    </div>
  );
}
