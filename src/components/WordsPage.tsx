import { useMemo, useState } from 'react';
import { useLocale } from '../hooks/useLocale';
import type { WordPost } from '../core/wordPost';
import {
  collectWordIndex,
  searchWordIndex,
  sortWordIndex,
  type LexiconEntry,
  type WordSortKey,
} from '../core/lexicon';
import { BOX } from './SideCard';
import { SiteSidebar } from './SiteSidebar';

interface WordsPageProps {
  posts: WordPost[];
  lexicon: LexiconEntry[];
  onOpenWord: (word: string) => void;
  onOpenTag: (tag: string) => void;
}

const CELL = 'border border-[var(--color-border)] px-3 py-2 align-top';
const HEAD =
  'border border-[var(--color-border)] px-3 py-1.5 font-semibold whitespace-nowrap';
const CHIP =
  'tag-chip rounded border border-[var(--color-border)] bg-[var(--color-bg)] px-1.5 py-px text-xs leading-tight text-[var(--color-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-text)]';

/**
 * /word: every word the site knows, as a data table — bordered cells, a
 * search box in the title bar, sortable columns (word / examples / latest).
 * ● after a word marks a hand-written entry.
 */
export function WordsPage({
  posts,
  lexicon,
  onOpenWord,
  onOpenTag,
}: WordsPageProps) {
  const { t } = useLocale();
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<WordSortKey>('latest');
  const [desc, setDesc] = useState(true);

  const items = useMemo(
    () => collectWordIndex(posts, lexicon),
    [posts, lexicon]
  );
  const shown = useMemo(
    () => sortWordIndex(searchWordIndex(items, query), sortKey, desc),
    [items, query, sortKey, desc]
  );
  const sortBy = (key: WordSortKey) => {
    if (key === sortKey) setDesc((d) => !d);
    else {
      setSortKey(key);
      setDesc(key !== 'word');
    }
  };
  const arrow = (key: WordSortKey) =>
    key === sortKey ? (desc ? ' ↓' : ' ↑') : '';
  const sortable = (key: WordSortKey, label: string) => (
    <th
      scope="col"
      aria-sort={key === sortKey ? (desc ? 'descending' : 'ascending') : 'none'}
      className={HEAD}
    >
      <button
        onClick={() => sortBy(key)}
        className="plain-btn w-full text-left hover:text-[var(--color-accent)]"
      >
        {label}
        {arrow(key)}
      </button>
    </th>
  );

  return (
    <div className="mx-auto max-w-[1140px] px-4 py-5 sm:px-6 sm:py-6">
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className={`min-w-0 ${BOX} shadow-[1px_1px_4px_rgba(0,0,0,0.22)]`}>
          {/* Title bar: name left, search right (Codeforces-style) */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-t-xl border-b border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-border)_45%,var(--color-card))] px-3 py-1.5">
            <h1 className="text-base font-bold">
              {t('words')}
              <span className="ml-2 text-xs font-normal text-[var(--color-muted)]">
                {shown.length}
                {shown.length !== items.length ? ` / ${items.length}` : ''}{' '}
                {t('wordsCount')}
              </span>
            </h1>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('searchWords')}
              aria-label={t('searchWords')}
              className="w-full rounded border border-[var(--color-border)] bg-transparent px-2 py-0.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:outline-none sm:w-72"
            />
          </div>

          <div className="overflow-x-auto rounded-b-xl">
            <table className="w-full border-collapse text-sm [&_tbody>tr:last-child>td]:border-b-0 [&_thead_th]:border-t-0 [&_tr>*:first-child]:border-l-0 [&_tr>*:last-child]:border-r-0">
              <thead className="text-left text-xs text-[var(--color-muted)]">
                <tr>
                  {sortable('word', t('word'))}
                  <th scope="col" className={HEAD}>
                    {t('sense')}
                  </th>
                  <th scope="col" className={HEAD}>
                    {t('tags')}
                  </th>
                  {sortable('examples', t('examples'))}
                  {sortable('latest', t('latest'))}
                </tr>
              </thead>
              <tbody>
                {shown.map((item) => (
                  <tr
                    key={item.word}
                    className="odd:bg-[var(--color-bg)] hover:bg-[var(--color-accent)]/10"
                  >
                    <td className={CELL}>
                      <button
                        onClick={() => onOpenWord(item.word)}
                        className="plain-btn font-mono font-semibold text-[var(--color-accent)] hover:underline"
                      >
                        {item.word}
                      </button>
                      {item.hasEntry && (
                        <span
                          title={t('wordEntry')}
                          className="ml-1 text-[10px] text-[var(--color-accent)]"
                        >
                          ●
                        </span>
                      )}
                      {item.forms.length > 0 && (
                        <div className="mt-0.5 font-mono text-xs text-[var(--color-muted)]">
                          {item.forms.join(' · ')}
                        </div>
                      )}
                    </td>
                    <td
                      className={`${CELL} max-w-[26rem] text-[var(--color-text)]`}
                    >
                      {item.senses && item.senses.length > 0 ? (
                        <ol className="list-decimal space-y-0.5 pl-5">
                          {item.senses.map((sense) => (
                            <li key={sense}>{sense}</li>
                          ))}
                        </ol>
                      ) : item.sense ? (
                        <span>{item.sense}</span>
                      ) : (
                        <span className="text-[var(--color-muted)]">—</span>
                      )}
                    </td>
                    <td className={CELL}>
                      <div className="flex flex-wrap gap-1">
                        {item.tags.map((tag) => (
                          <button
                            key={tag}
                            onClick={() => onOpenTag(tag)}
                            className={CHIP}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className={`${CELL} text-center font-mono`}>
                      {item.examples}
                    </td>
                    <td
                      className={`${CELL} font-mono text-xs whitespace-nowrap text-[var(--color-muted)]`}
                    >
                      {item.latest ?? '—'}
                    </td>
                  </tr>
                ))}
                {shown.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className={`${CELL} text-center text-[var(--color-muted)]`}
                    >
                      {t('noWords')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <SiteSidebar articleCount={posts.length} wordCount={items.length} />
      </div>
    </div>
  );
}
