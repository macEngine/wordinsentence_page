/**
 * Word list data model and the pure logic behind the WordList table.
 *
 * Everything here is framework-free so it can be unit-tested directly with
 * `node --experimental-strip-types tests/words.test.ts` (see package.json
 * `test:words`). The React component in src/components/WordList.tsx only
 * renders what these functions return.
 */

export interface WordEntry {
  /** The vocabulary item itself, e.g. "serendipity". */
  word: string;
  /** The sentence the word was met in. Long text; shown truncated in the table. */
  sentence: string;
  /** Where the sentence came from: book / article / podcast name. Drives the first pill row. */
  source?: string;
  /** ISO date `YYYY-MM-DD` when the word was recorded. Table is sorted by this, newest first. */
  date: string;
  /** Free-form labels. Drive the second pill row. */
  tags?: string[];
  /** Optional one-line meaning, shown in the expanded row. */
  meaning?: string;
  /** Optional http(s) link to the source. Shown in the expanded row. */
  link?: string;
}

export const WORD_PAGE_SIZE = 16;
export const SENTENCE_PREVIEW_LENGTH = 80;

export interface WordFilter {
  /** `null` means "all sources". */
  source: string | null;
  /** `null` means "all tags". */
  tag: string | null;
}

export const ALL_WORDS_FILTER: WordFilter = { source: null, tag: null };

/** Stable identity for a row; `date|word` is unique enough for a hand-written list. */
export function wordKey(entry: WordEntry): string {
  return `${entry.date}|${entry.word}`;
}

function countBy(values: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
}

/** Distinct values sorted by frequency (desc), then alphabetically for ties. */
function rankedDistinct(values: string[]): string[] {
  return [...countBy(values).entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([value]) => value);
}

/** Sources that appear in the list, most frequent first. Empty strings are ignored. */
export function collectSources(words: WordEntry[]): string[] {
  return rankedDistinct(
    words.map((w) => w.source?.trim() ?? '').filter((s) => s.length > 0)
  );
}

/** Tags that appear in the list, most frequent first. Empty strings are ignored. */
export function collectTags(words: WordEntry[]): string[] {
  return rankedDistinct(
    words
      .flatMap((w) => w.tags ?? [])
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
  );
}

export function filterWords<T extends WordEntry>(
  words: T[],
  filter: WordFilter
): T[] {
  return words.filter((w) => {
    if (filter.source !== null && (w.source?.trim() ?? '') !== filter.source) {
      return false;
    }
    if (filter.tag !== null && !(w.tags ?? []).includes(filter.tag)) {
      return false;
    }
    return true;
  });
}

/** Newest first; ties keep input order (Array.prototype.sort is stable). */
export function sortWordsByDate<T extends WordEntry>(words: T[]): T[] {
  return [...words].sort((a, b) => b.date.localeCompare(a.date));
}

export interface PageSlice<T> {
  items: T[];
  /** Clamped to `[0, totalPages - 1]`, or 0 when there are no items. */
  page: number;
  totalPages: number;
  /** 1-based index of the first shown item, 0 when empty. */
  from: number;
  /** 1-based index of the last shown item, 0 when empty. */
  to: number;
}

export function paginate<T>(
  items: T[],
  requestedPage: number,
  pageSize: number = WORD_PAGE_SIZE
): PageSlice<T> {
  const totalPages = Math.ceil(items.length / pageSize);
  const page = Math.min(
    Math.max(0, requestedPage),
    Math.max(0, totalPages - 1)
  );
  const start = page * pageSize;
  const pageItems = items.slice(start, start + pageSize);
  return {
    items: pageItems,
    page,
    totalPages,
    from: pageItems.length ? start + 1 : 0,
    to: pageItems.length ? start + pageItems.length : 0,
  };
}

/** Cut at a word boundary where possible and add an ellipsis. */
export function truncateSentence(
  sentence: string,
  max: number = SENTENCE_PREVIEW_LENGTH
): string {
  if (sentence.length <= max) return sentence;
  const cut = sentence.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  const head = lastSpace > max / 2 ? cut.slice(0, lastSpace) : cut;
  return `${head.trimEnd()}…`;
}

export interface SentenceSegment {
  text: string;
  /** True when this segment is an occurrence of the word. */
  match: boolean;
  /** Character offset of this segment in the plain sentence; unique, usable as a React key. */
  start: number;
}

/** Remove markdown `**bold**` markers. */
export function stripBold(s: string): string {
  return s.replace(/\*\*/g, '');
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Segments from explicit `**bold**` markers; offsets are in the stripped text. */
function highlightBold(sentence: string): SentenceSegment[] {
  const segments: SentenceSegment[] = [];
  let start = 0;
  for (const [i, part] of sentence.split(/\*\*([^*]+)\*\*/).entries()) {
    if (!part) continue;
    segments.push({ text: part, match: i % 2 === 1, start });
    start += part.length;
  }
  return segments.length ? segments : [{ text: '', match: false, start: 0 }];
}

/**
 * Split a sentence into plain / highlighted segments around the word.
 * If the sentence carries markdown `**bold**` markers (as the blog posts do),
 * those decide the highlight, which also covers inflections the regex cannot
 * guess ("lash out" -> "**lashed**"). Otherwise: case-insensitive, must start
 * at a word boundary, and swallows a trailing inflection so "run" also
 * highlights "running" and "runs".
 */
export function highlightWord(
  sentence: string,
  word: string
): SentenceSegment[] {
  if (sentence.includes('**')) return highlightBold(sentence);
  const needle = word.trim();
  if (!needle) return [{ text: sentence, match: false, start: 0 }];
  const re = new RegExp(`\\b${escapeRegExp(needle)}\\w*`, 'gi');
  const segments: SentenceSegment[] = [];
  let last = 0;
  for (const m of sentence.matchAll(re)) {
    const start = m.index ?? 0;
    if (start > last) {
      segments.push({
        text: sentence.slice(last, start),
        match: false,
        start: last,
      });
    }
    segments.push({ text: m[0], match: true, start });
    last = start + m[0].length;
  }
  if (last < sentence.length) {
    segments.push({ text: sentence.slice(last), match: false, start: last });
  }
  return segments.length
    ? segments
    : [{ text: sentence, match: false, start: 0 }];
}

/** Keep only http(s) links so a typo in words.json cannot inject `javascript:`. */
export function safeLink(link: string | undefined): string | null {
  if (!link) return null;
  try {
    const url = new URL(link);
    return url.protocol === 'http:' || url.protocol === 'https:' ? link : null;
  } catch {
    return null;
  }
}
