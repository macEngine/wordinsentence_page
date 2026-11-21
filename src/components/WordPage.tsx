import { useMemo, type ReactNode } from 'react';
import { useLocale } from '../hooks/useLocale';
import type { WordPostSummary } from '../core/articleIndex';
import {
  clipExample,
  examplesForWord,
  findLexiconEntry,
  formsWithExamples,
  hookItems,
  senseItems,
  isWordTag,
  phraseExamples,
  phraseItems,
  type LexiconEntry,
} from '../core/lexicon';
import { highlightWord, sortWordsByDate } from '../core/words';
import { PostMarkdown } from './PostMarkdown';
import { BOX, SideCard } from './SideCard';

interface WordPageProps {
  word: string;
  posts: WordPostSummary[];
  lexicon: LexiconEntry[];
  onBack: () => void;
  onOpen: (post: WordPostSummary) => void;
  onOpenTag: (tag: string) => void;
  onOpenWord: (word: string) => void;
}

const CHIP =
  'tag-chip rounded border border-[var(--color-border)] bg-[var(--color-bg)] px-1.5 py-px leading-tight hover:border-[var(--color-accent)] hover:text-[var(--color-text)]';

function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="mb-2 text-base font-bold">{children}</h2>;
}

/** One example row: date · source, then the one sentence (or clause) that holds the word. */
function ExampleRow({
  post,
  onOpen,
}: {
  post: WordPostSummary;
  onOpen: (post: WordPostSummary) => void;
}) {
  const parts = highlightWord(clipExample(post.sentence, post.word), post.word);
  return (
    <li>
      <button
        onClick={() => onOpen(post)}
        className="block w-full rounded-lg px-3 py-2.5 text-left hover:bg-[var(--color-bg)]"
      >
        <p className="flex flex-wrap items-center gap-x-2 text-xs text-[var(--color-muted)]">
          <span className="font-mono">{post.date}</span>
          {post.source && <span>· {post.source}</span>}
          <span className="font-mono text-[var(--color-accent)]">
            {post.word}
          </span>
        </p>
        <p className="mt-1 border-l-2 border-[var(--color-accent)] pl-3 text-sm leading-relaxed">
          {parts.map((p) =>
            p.match ? (
              <mark
                key={p.start}
                className="rounded bg-[var(--color-accent)]/20 px-0.5 font-semibold text-[var(--color-text)]"
              >
                {p.text}
              </mark>
            ) : (
              <span key={p.start}>{p.text}</span>
            )
          )}
        </p>
      </button>
    </li>
  );
}

/**
 * /word/<word>: the word itself. Left: senses, then every post that used it
 * (the example index). Right: the hooks that make it stick, phrases, forms.
 * Works for words without a lexicon file too (examples only).
 */
export function WordPage({
  word,
  posts,
  lexicon,
  onBack,
  onOpen,
  onOpenTag,
  onOpenWord,
}: WordPageProps) {
  const { t } = useLocale();
  const entry = useMemo(() => findLexiconEntry(lexicon, word), [lexicon, word]);
  const headword = entry?.word ?? word.toLowerCase();
  const examples = useMemo(
    () => sortWordsByDate(examplesForWord(posts, lexicon, word)),
    [posts, lexicon, word]
  );
  // Phonetics / tags: the entry's, else borrowed from the newest example post.
  const sample = examples[0];
  const phoneticUk = entry?.phoneticUk ?? sample?.phoneticUk;
  const phoneticUs = entry?.phoneticUs ?? sample?.phoneticUs;
  const tags = (entry?.tags ?? sample?.tags ?? []).filter(
    (x) => !isWordTag(x) && x !== sample?.series
  );
  // Only forms that actually appear in a post; nothing to show otherwise.
  const otherForms = useMemo(
    () => formsWithExamples(posts, lexicon, word),
    [posts, lexicon, word]
  );
  const hooks = entry ? hookItems(entry) : [];
  const senses = entry ? senseItems(entry) : [];
  // Each phrase with the posts whose sentence uses it (linked in the card).
  const phrases = useMemo(
    () =>
      (entry ? phraseItems(entry) : []).map((ph) => ({
        ...ph,
        used: phraseExamples(posts, ph.phrase),
      })),
    [entry, posts]
  );

  return (
    <div className="mx-auto max-w-[1248px] px-4 py-5 sm:px-6 sm:py-6">
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_288px]">
        {/* Main column */}
        <div className="flex min-w-0 flex-col gap-4">
          <div className={BOX}>
            <div className="px-4 py-1.5 sm:px-6 sm:py-2">
              <nav className="flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
                <button
                  onClick={onBack}
                  className="hover:text-[var(--color-text)] hover:underline"
                >
                  {t('words')}
                </button>
                <span aria-hidden>›</span>
                <span>{t('wordEntry')}</span>
              </nav>
              <h1 className="font-mono text-2xl font-bold sm:text-3xl">
                {headword}
              </h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-[var(--color-muted)]">
                {phoneticUk && <span>英 {phoneticUk}</span>}
                {phoneticUs && <span>美 {phoneticUs}</span>}
                {tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => onOpenTag(tag)}
                    className={CHIP}
                  >
                    {tag}
                  </button>
                ))}
              </p>
            </div>

            <div className="border-t border-[var(--color-border)] px-4 py-4 sm:px-6 sm:py-5">
              {senses.length > 0 ? (
                <section>
                  <SectionTitle>{t('senses')}</SectionTitle>
                  <ol className="list-decimal space-y-2.5 pl-6 leading-relaxed marker:text-[var(--color-muted)]">
                    {senses.map((sense) => (
                      <li key={sense.label}>
                        <span className="text-[15px] font-semibold">
                          {sense.label}
                        </span>
                        {sense.detail && (
                          <span className="ml-2 text-sm text-[var(--color-muted)]">
                            {sense.detail}
                          </span>
                        )}
                      </li>
                    ))}
                  </ol>
                </section>
              ) : (
                <p className="text-sm text-[var(--color-muted)]">
                  {t('noEntry')}
                </p>
              )}
            </div>

            <section className="border-t border-[var(--color-border)] px-4 py-4 sm:px-6 sm:py-5">
              <SectionTitle>
                {t('examples')}
                <span className="ml-2 text-xs font-normal text-[var(--color-muted)]">
                  {examples.length} {t('examplesCount')}
                </span>
              </SectionTitle>
              {examples.length ? (
                <ul className="-mx-3 divide-y divide-[var(--color-border)]">
                  {examples.map((p) => (
                    <ExampleRow
                      key={`${p.date}|${p.word}`}
                      post={p}
                      onOpen={onOpen}
                    />
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[var(--color-muted)]">
                  {t('noExamples')}
                </p>
              )}
            </section>

            {entry?.extra.map((s) => (
              <section
                key={s.title}
                className="border-t border-[var(--color-border)] px-4 py-4 sm:px-6 sm:py-5"
              >
                <SectionTitle>{s.title}</SectionTitle>
                <PostMarkdown>{s.markdown}</PostMarkdown>
              </section>
            ))}
          </div>
        </div>

        {/* Sidebar: right column on desktop, below on phones */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-[var(--header-offset)]">
          {hooks.length > 0 && (
            <div className={BOX}>
              <h2 className="border-b border-[var(--color-border)] px-3 py-1.5 text-sm font-semibold">
                <span aria-hidden className="mr-1.5 text-[var(--color-accent)]">
                  →
                </span>
                {t('hooks')}
              </h2>
              <ul className="divide-y divide-[var(--color-border)]">
                {hooks.map((h) => (
                  <li key={h.title} className="px-3 py-2.5">
                    <p className="text-base leading-snug font-bold">
                      {h.title}
                    </p>
                    {h.note && (
                      <p className="mt-1 text-xs leading-relaxed text-[var(--color-muted)]">
                        {h.note}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {phrases.length > 0 && (
            <SideCard title={t('phrases')}>
              <ul className="list-disc space-y-1.5 pl-4 text-sm leading-relaxed">
                {phrases.map((ph) => (
                  <li key={ph.phrase}>
                    {ph.used.length > 0 ? (
                      <button
                        onClick={() => onOpen(ph.used[0])}
                        title={`${ph.used.length} ${t('examplesCount')} · ${ph.used[0].word} ${ph.used[0].date}`}
                        className="font-semibold text-[var(--color-accent)] underline decoration-dotted underline-offset-2 hover:decoration-solid"
                      >
                        {ph.phrase}
                      </button>
                    ) : (
                      <span className="font-semibold">{ph.phrase}</span>
                    )}
                    {ph.meaning && (
                      <span className="ml-1.5 text-[var(--color-muted)]">
                        {ph.meaning}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </SideCard>
          )}
          {otherForms.length > 0 && (
            <SideCard title={t('forms')}>
              <p className="flex flex-wrap gap-1.5 font-mono text-sm">
                {otherForms.map(({ form, count }) => (
                  <button
                    key={form}
                    onClick={() => onOpenWord(form)}
                    className={CHIP}
                    title={`${count} ${t('examplesCount')}`}
                  >
                    {form}
                  </button>
                ))}
              </p>
            </SideCard>
          )}
        </div>
      </div>
    </div>
  );
}
