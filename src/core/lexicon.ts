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
  /** Other spellings actually seen in posts (headwords or word tags), canonical excluded. */
  forms: string[];
  /** Has a hand-written lexicon page. */
  hasEntry: boolean;
  /** First 常用义 as plain text, else a short gloss read off the newest post. */
  sense?: string;
  /** All 常用义 labels (lexicon entries only), for the numbered column. */
  senses?: string[];
  /** Labels (六级, GRE…); word tags and the series tag excluded. */
  tags: string[];
  /** Plain text of `## 一眼记住`, searched but not shown in the table. */
  hooks?: string;
  /** Number of example posts. */
  examples: number;
  /** Most recent example date, for ordering. */
  latest?: string;
}

/** Markdown inline markup -> plain text (bold, code, links, emphasis). */
export function plainText(md: string): string {
  return md
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/(^|\s)[*_](\S.*?\S|\S)[*_](?=\s|$|[，。,.])/g, '$1$2')
    .trim();
}

/**
 * Every list item of `## 常用义`, as short plain text: the label before the
 * first bracket or dash, e.g. "adj. 鲜明的、赤裸裸的（对比…）— a stark contrast"
 * -> "adj. 鲜明的、赤裸裸的".
 */
export function senseList(entry: LexiconEntry): string[] {
  return (entry.senses ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => /^(\d+\.|[-*])\s+/.test(l))
    .map((l) => shortLabel(plainText(l.replace(/^(\d+\.|[-*])\s+/, ''))));
}

export interface SenseItem {
  /** The gloss, e.g. "adj. 鲜明的、赤裸裸的" (the **bold** run, else the whole line). */
  label: string;
  /** Scope note and collocations after the label, plain text. */
  detail?: string;
}

/** Every `## 常用义` item split into its bold label and the rest. */
export function senseItems(entry: LexiconEntry): SenseItem[] {
  return (entry.senses ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => /^(\d+\.|[-*])\s+/.test(l))
    .map((l) => {
      const body = l.replace(/^(\d+\.|[-*])\s+/, '');
      const m = body.match(/^\*\*(.+?)\*\*\s*(.*)$/s);
      if (!m) return { label: plainText(body) };
      const detail = plainText(m[2])
        .replace(/^[—–\-:：]\s*/, '')
        .trim();
      return { label: m[1].trim(), detail: detail || undefined };
    });
}

/** Cut at the first bracket / dash so only the gloss itself is left. */
function shortLabel(text: string): string {
  return text
    .split(/\s*(?:（|\(|—|–|\s-\s)/)[0]
    .replace(/[；;，,：:、\s]+$/, '')
    .trim();
}

/** The first list item of `## 常用义`, as plain text. */
export function firstSense(entry: LexiconEntry): string | undefined {
  return senseList(entry)[0];
}

/**
 * One short gloss for a word that has no lexicon entry yet, read off its
 * post: the headword's row in 近义词辨析, else the “…” after 意思是 in the
 * 解析, else nothing (the table shows a dash rather than a paragraph).
 */
export function shortMeaning(post: WordPost): string | undefined {
  const w = normalizeWord(post.word);
  const row = (post.synonyms ?? []).find((s) =>
    normalizeWord(s.word).split(/\s+/).includes(w)
  );
  if (row?.nuance) return shortLabel(row.nuance);
  const m = post.analysis?.match(/意思是[“"]([^”"]{1,40})[”"]/);
  return m ? m[1] : undefined;
}

/**
 * Clip a quoted example to the one sentence that contains the word (found by
 * its `**bold**` marker, else by stem). If that sentence is still longer than
 * `max`, keep a window of words around the hit with … on the cut side(s).
 * Bold markers are preserved so the renderer can still highlight.
 */
export function clipExample(sentence: string, word: string, max = 140): string {
  const text = sentence.trim();
  let hit = text.search(/\*\*/);
  if (hit < 0) {
    const re = new RegExp(
      `\\b${word.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
      'i'
    );
    hit = Math.max(0, text.search(re));
  }
  // sentence boundaries: . ! ? followed by space, or Chinese 。！？
  const bounds = [0];
  for (const m of text.matchAll(/[.!?…]["”’)]*\s+|[。！？]/g)) {
    bounds.push((m.index ?? 0) + m[0].length);
  }
  bounds.push(text.length);
  let start = 0;
  let end = text.length;
  for (let i = 0; i < bounds.length - 1; i++) {
    if (hit >= bounds[i] && hit < bounds[i + 1]) {
      start = bounds[i];
      end = bounds[i + 1];
      break;
    }
  }
  let clip = text.slice(start, end).trim();
  if (clip.length <= max) return clip;
  // window of words around the hit
  const rel = hit - start;
  const words = clip.split(/(\s+)/);
  let pos = 0;
  let hitIdx = 0;
  for (let i = 0; i < words.length; i++) {
    if (pos + words[i].length > rel) {
      hitIdx = i;
      break;
    }
    pos += words[i].length;
  }
  const span = 16; // tokens (words + separators) on each side ≈ 8 words
  const from = Math.max(0, hitIdx - span);
  const to = Math.min(words.length, hitIdx + span + 1);
  clip = words.slice(from, to).join('').trim();
  if (from > 0) clip = '…' + clip;
  if (to < words.length) clip = clip.replace(/[,;:，；：]$/, '') + '…';
  return clip;
}

/** Every word the site knows about: lexicon entries plus post headwords. */
export function collectWordIndex(
  posts: WordPost[],
  entries: LexiconEntry[]
): WordIndexItem[] {
  const items = new Map<string, WordIndexItem>();
  for (const e of entries) {
    items.set(e.word, {
      word: e.word,
      forms: [], // filled from posts below: only forms actually seen
      hasEntry: true,
      sense: firstSense(e),
      senses: senseList(e),
      tags: e.tags ?? [],
      hooks: e.hooks ? plainText(e.hooks) : undefined,
      examples: 0,
    });
  }
  const add = (list: string[], values: string[]) => {
    for (const v of values) if (!list.includes(v)) list.push(v);
  };
  for (const p of posts) {
    const canonical =
      findLexiconEntry(entries, p.word)?.word ?? normalizeWord(p.word);
    const item = items.get(canonical) ?? {
      word: canonical,
      forms: [],
      hasEntry: false,
      tags: [],
      examples: 0,
    };
    const tags = p.tags ?? [];
    add(
      item.forms,
      [p.word, ...tags.filter(isWordTag)]
        .map(normalizeWord)
        .filter((w) => w !== canonical)
    );
    add(
      item.tags,
      tags.filter((x) => !isWordTag(x) && x !== p.series)
    );
    item.examples += 1;
    if (!item.latest || p.date > item.latest) {
      item.latest = p.date;
      if (!item.hasEntry) item.sense = shortMeaning(p);
    }
    items.set(canonical, item);
  }
  return [...items.values()].sort(
    (a, b) =>
      (b.latest ?? '').localeCompare(a.latest ?? '') ||
      a.word.localeCompare(b.word)
  );
}

export type WordSortKey = 'word' | 'examples' | 'latest';

/** Space-separated terms, all of which must match word / forms / tags / sense. */
export function searchWordIndex(
  items: WordIndexItem[],
  query: string
): WordIndexItem[] {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 0);
  if (!terms.length) return items;
  return items.filter((i) => {
    const text = [i.word, ...i.forms, ...i.tags, i.sense ?? '', i.hooks ?? '']
      .join('\n')
      .toLowerCase();
    return terms.every((t) => text.includes(t));
  });
}

export function sortWordIndex(
  items: WordIndexItem[],
  key: WordSortKey,
  desc: boolean
): WordIndexItem[] {
  const cmp = (a: WordIndexItem, b: WordIndexItem): number => {
    if (key === 'word') return a.word.localeCompare(b.word);
    if (key === 'examples') return a.examples - b.examples;
    return (a.latest ?? '').localeCompare(b.latest ?? '');
  };
  return [...items].sort(
    (a, b) => (desc ? -cmp(a, b) : cmp(a, b)) || a.word.localeCompare(b.word)
  );
}

export interface HookItem {
  /** The headline: leading emoji (if any) plus the first **bold** run. */
  title: string;
  /** The rest of the bullet, plain text, short. */
  note?: string;
}

/**
 * `## 一眼记住` bullets as headline + note pairs, one per bullet. The first
 * `**bold**` run is the headline; a leading emoji stays with it. Bullets
 * without bold use the whole line as the headline.
 */
export function hookItems(entry: LexiconEntry): HookItem[] {
  return (entry.hooks ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => /^[-*]\s+/.test(l))
    .map((l) => {
      const body = l.replace(/^[-*]\s+/, '');
      const m = body.match(/^(\S*?)\s*\*\*(.+?)\*\*\s*(.*)$/s);
      if (!m) return { title: plainText(body) };
      const [, lead, bold, rest] = m;
      const emoji = /^\p{Extended_Pictographic}/u.test(lead) ? lead : '';
      const pre = emoji ? '' : plainText(lead);
      const note = plainText(rest)
        .replace(/^[：:—–\-,，。]+\s*/, '')
        .trim();
      return {
        title: [emoji, pre, bold].filter(Boolean).join(' ').trim(),
        note: note || undefined,
      };
    });
}

/**
 * Of a word's forms, only those that actually appear in the posts (as a
 * headword or a word tag), with their example counts. The canonical word is
 * excluded; an empty result means "nothing to show".
 */
export function formsWithExamples(
  posts: WordPost[],
  entries: LexiconEntry[],
  word: string
): { form: string; count: number }[] {
  const entry = findLexiconEntry(entries, word);
  const canonical = entry?.word ?? normalizeWord(word);
  const forms = entry?.forms ?? [canonical];
  return forms
    .filter((f) => f !== canonical)
    .map((form) => ({
      form,
      count: posts.filter(
        (p) =>
          normalizeWord(p.word) === form ||
          (p.tags ?? []).some((t) => isWordTag(t) && normalizeWord(t) === form)
      ).length,
    }))
    .filter((f) => f.count > 0);
}

export interface PhraseItem {
  /** The phrase as written, e.g. "in stark contrast to …". */
  phrase: string;
  /** Meaning after the bold run, plain text. */
  meaning?: string;
}

/** `## 短语` bullets: `- **phrase** meaning` -> { phrase, meaning }. */
export function phraseItems(entry: LexiconEntry): PhraseItem[] {
  return (entry.phrases ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => /^[-*]\s+/.test(l))
    .map((l) => {
      const body = l.replace(/^[-*]\s+/, '');
      const m = body.match(/^\*\*(.+?)\*\*\s*(.*)$/s);
      if (!m) return { phrase: plainText(body) };
      const meaning = plainText(m[2]).trim();
      return { phrase: m[1].trim(), meaning: meaning || undefined };
    });
}

const escapeRe = (w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const BE_FORMS = '(?:be|is|are|was|were|been|being|am)';
const PLACEHOLDERS = new Set([
  'sth',
  'sb',
  'something',
  'somebody',
  'someone',
  'one',
]);

/**
 * Regex for "does this sentence use the phrase": words of 4+ letters match
 * by stem (deluge -> deluged), short words exactly, `be` matches any form, …/sth/sb placeholders are
 * skipped, and ` / ` separates alternatives ("the stark reality / truth").
 */
export function phraseRegex(phrase: string): RegExp | null {
  const alternatives = phrase
    .split(/\s*\/\s*/)
    .map((alt) =>
      alt
        .toLowerCase()
        .replace(/[….]+/g, ' ')
        .split(/[^a-z'-]+/)
        .filter((w) => w.length > 0 && !PLACEHOLDERS.has(w))
    )
    .filter((words) => words.length > 0);
  if (!alternatives.length) return null;
  // "the stark reality / truth": the tail alternative reuses the head words
  const head = alternatives[0];
  const patterns = alternatives.map((words, i) => {
    const full =
      i === 0 || words.length > 1 ? words : [...head.slice(0, -1), ...words];
    return full
      .map(
        (w) =>
          w === 'be'
            ? `\\b${BE_FORMS}\\b`
            : w.length <= 3
              ? `\\b${escapeRe(w)}\\b` // a / of / to: exact, no stem
              : `\\b${escapeRe(w)}\\w*` // deluge -> deluged, deluges
      )
      .join('\\W+');
  });
  return new RegExp(patterns.join('|'), 'i');
}

/** Posts whose quoted sentence uses the phrase. */
export function phraseExamples(posts: WordPost[], phrase: string): WordPost[] {
  const re = phraseRegex(phrase);
  if (!re) return [];
  return posts.filter((p) => re.test(p.sentence.replace(/\*\*/g, '')));
}
