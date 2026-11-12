import { useMemo, useState } from 'react';
import { useLocale } from '../hooks/useLocale';
import {
  ALL_WORDS_FILTER,
  collectSources,
  collectTags,
  filterWords,
  highlightWord,
  paginate,
  safeLink,
  sortWordsByDate,
  truncateSentence,
  wordKey,
  type WordEntry,
  type WordFilter,
} from '../core/words';

interface WordListProps {
  words: WordEntry[];
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

function Sentence({ sentence, word }: { sentence: string; word: string }) {
  return (
    <>
      {highlightWord(sentence, word).map((seg) =>
        seg.match ? (
          <mark
            key={seg.start}
            className="rounded bg-[var(--color-accent)]/20 px-0.5 font-semibold text-[var(--color-text)]"
          >
            {seg.text}
          </mark>
        ) : (
          <span key={seg.start}>{seg.text}</span>
        )
      )}
    </>
  );
}

/**
 * Replaces running_page's ActivityLog. Same card, same pill rows, same
 * table + pagination; the two pill rows are derived from the data (source,
 * tag) instead of hard-coded distance thresholds, and because a sentence is
 * far too long for a cell, a row shows a truncated preview and expands in
 * place to the full sentence (word highlighted) when selected.
 */
export function WordList({ words }: WordListProps) {
  const { t } = useLocale();
  const [filter, setFilter] = useState<WordFilter>(ALL_WORDS_FILTER);
  const [page, setPage] = useState(0);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

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
    setSelectedKey(null);
  };
  const toggleRow = (key: string) =>
    setSelectedKey((current) => (current === key ? null : key));

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

      <p className="table-scroll-hint mb-2 text-xs text-[var(--color-muted)]">
        {t('wordHint')}
      </p>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-muted)]">
              <th className="pb-3 font-medium">{t('date')}</th>
              <th className="pb-3 font-medium">{t('word')}</th>
              <th className="pb-3 font-medium">{t('sentence')}</th>
              <th className="pb-3 font-medium">{t('source')}</th>
            </tr>
          </thead>
          <tbody>
            {!slice.items.length && (
              <tr>
                <td
                  colSpan={4}
                  className="py-10 text-center text-[var(--color-muted)]"
                >
                  {t('noWords')}
                </td>
              </tr>
            )}
            {slice.items.map((entry) => {
              const key = wordKey(entry);
              const selected = key === selectedKey;
              const link = safeLink(entry.link);
              return (
                <tr
                  key={key}
                  tabIndex={0}
                  aria-selected={selected}
                  aria-expanded={selected}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      toggleRow(key);
                    }
                  }}
                  onClick={() => toggleRow(key)}
                  className={`cursor-pointer border-b border-[var(--color-border)]/30 align-top transition-colors ${
                    selected
                      ? 'border-l-2 border-l-[var(--color-accent)] bg-[var(--color-accent)]/10'
                      : 'hover:bg-[var(--color-bg)]'
                  }`}
                >
                  <td className="py-3 whitespace-nowrap text-[var(--color-muted)]">
                    {entry.date}
                  </td>
                  <td className="py-3 font-mono font-medium whitespace-nowrap">
                    {entry.word}
                  </td>
                  <td className="py-3">
                    {selected ? (
                      <div className="space-y-2">
                        <p className="leading-relaxed">
                          <Sentence
                            sentence={entry.sentence}
                            word={entry.word}
                          />
                        </p>
                        {entry.meaning && (
                          <p className="text-xs text-[var(--color-muted)]">
                            <span className="font-medium">{t('meaning')}:</span>{' '}
                            {entry.meaning}
                          </p>
                        )}
                        {link && (
                          <a
                            href={link}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(event) => event.stopPropagation()}
                            className="text-xs text-[var(--color-accent)] hover:underline"
                          >
                            {t('openSource')} ↗
                          </a>
                        )}
                      </div>
                    ) : (
                      <span className="text-[var(--color-muted)]">
                        {truncateSentence(entry.sentence)}
                      </span>
                    )}
                  </td>
                  <td className="py-3 whitespace-nowrap text-[var(--color-muted)]">
                    {entry.source ?? '--'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

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
