/**
 * The lexicon: one hand-written page per word, independent of the daily posts.
 *
 * A post (words/*.md) is one real example of a word in the wild. A lexicon
 * entry (lexicon/<word>.md) is the word itself: its most common senses, the
 * hooks that make it stick (imagery, a famous name, a phrase), and its word
 * forms. The word page joins the two: entry on top, every post that used the
 * word underneath.
 *
 * Entry format:
 *   ---
 *   word: stark
 *   forms: [stark, starkly, starkness]      every spelling that counts as this word
 *   phonetic_uk: /stɑːk/
 *   phonetic_us: /stɑːrk/
 *   tags: [六级, 考研]
 *   ---
 *   ## 常用义        numbered / bulleted list, one sense per item
 *   ## 一眼记住      imagery, famous bearers, etymology — the sidebar card
 *   ## 短语          fixed phrases, one per bullet
 *   ## <anything>    extra sections are rendered after the example index
 *
 * Pure functions, no I/O: scripts/build-lexicon.ts reads the files.
 */
import { parseFrontmatter, splitSections } from './wordPost.ts';
import type { WordPost } from './wordPost.ts';

export interface LexiconEntry {
  /** Canonical spelling, lower-case. */
  word: string;
  /** All spellings that resolve to this entry, canonical first, lower-case. */
  forms: string[];
  phoneticUk?: string;
  phoneticUs?: string;
  tags?: string[];
  /** Markdown of `## 常用义`. */
  senses?: string;
  /** Markdown of `## 一眼记住`. */
  hooks?: string;
  /** Markdown of `## 短语`. */
  phrases?: string;
  /** Remaining sections, in file order. */
  extra: { title: string; markdown: string }[];
}

const SENSES = '常用义';
const HOOKS = '一眼记住';
const PHRASES = '短语';

export function normalizeWord(s: string): string {
  return s.trim().toLowerCase();
}

/** A tag that is a word (Latin letters) rather than a label (六级, GRE…). */
export function isWordTag(tag: string): boolean {
  return /^[a-z][a-z' -]*$/.test(tag.trim());
}

export function parseLexiconEntry(markdown: string): LexiconEntry {
  const { data, body } = parseFrontmatter(markdown);
  const str = (k: string): string | undefined => {
    const v = data[k];
    return typeof v === 'string' && v.length ? v : undefined;
  };
  const list = (k: string): string[] | undefined =>
    Array.isArray(data[k]) ? (data[k] as string[]) : undefined;

  const word = str('word');
  if (!word) throw new Error('parseLexiconEntry: frontmatter `word` missing');
  const canonical = normalizeWord(word);
  const forms = [
    canonical,
    ...(list('forms') ?? []).map(normalizeWord).filter((f) => f !== canonical),
  ];

  const sections = splitSections(body);
  const extra: LexiconEntry['extra'] = [];
  for (const m of body.matchAll(/^##\s+(.+)$/gm)) {
    const title = m[1].trim();
    const key = title.replace(/[^\p{L}\p{N}\s]/gu, '').trim();
    if (key === SENSES || key === HOOKS || key === PHRASES) continue;
    const md = sections.get(key);
    if (md) extra.push({ title, markdown: md });
  }

  const entry: LexiconEntry = {
    word: canonical,
    forms,
    phoneticUk: str('phonetic_uk'),
    phoneticUs: str('phonetic_us'),
    tags: list('tags'),
    senses: sections.get(SENSES),
    hooks: sections.get(HOOKS),
    phrases: sections.get(PHRASES),
    extra,
  };
  return Object.fromEntries(
    Object.entries(entry).filter(([, v]) => v !== undefined)
  ) as LexiconEntry;
}

/** The entry whose canonical word or any form equals `word`. */
export function findLexiconEntry(
  entries: LexiconEntry[],
  word: string
): LexiconEntry | undefined {
  const w = normalizeWord(word);
  return entries.find((e) => e.forms.includes(w));
}

/** Every spelling that counts as `word`: the entry's forms, or just the word. */
export function wordForms(entries: LexiconEntry[], word: string): string[] {
  return findLexiconEntry(entries, word)?.forms ?? [normalizeWord(word)];
}

/**
 * Posts that are examples of `word`: the post's headword or any of its word
 * tags matches one of the word's forms.
 */
export function examplesForWord(
  posts: WordPost[],
  entries: LexiconEntry[],
  word: string
): WordPost[] {
  const forms = new Set(wordForms(entries, word));
  return posts.filter(
    (p) =>
      forms.has(normalizeWord(p.word)) ||
      (p.tags ?? []).some((t) => isWordTag(t) && forms.has(normalizeWord(t)))
  );
}

export interface WordIndexItem {
  /** Canonical word (lexicon word, else the post headword). */
  word: string;
  /** Has a hand-written lexicon page. */
  hasEntry: boolean;
  /** Number of example posts. */
  examples: number;
  /** Most recent example date, for ordering. */
  latest?: string;
}

/** Every word the site knows about: lexicon entries plus post headwords. */
export function collectWordIndex(
  posts: WordPost[],
  entries: LexiconEntry[]
): WordIndexItem[] {
  const items = new Map<string, WordIndexItem>();
  for (const e of entries) {
    items.set(e.word, { word: e.word, hasEntry: true, examples: 0 });
  }
  for (const p of posts) {
    const canonical =
      findLexiconEntry(entries, p.word)?.word ?? normalizeWord(p.word);
    const item = items.get(canonical) ?? {
      word: canonical,
      hasEntry: false,
      examples: 0,
    };
    item.examples += 1;
    if (!item.latest || p.date > item.latest) item.latest = p.date;
    items.set(canonical, item);
  }
  return [...items.values()].sort(
    (a, b) =>
      (b.latest ?? '').localeCompare(a.latest ?? '') ||
      a.word.localeCompare(b.word)
  );
}
