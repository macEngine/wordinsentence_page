/**
 * Pure-logic tests for src/core/words.ts.
 * Run: node --experimental-strip-types tests/words.test.ts
 * No test framework on purpose: node:assert + node:test ship with node 22.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  collectSources,
  collectTags,
  filterWords,
  highlightWord,
  paginate,
  safeLink,
  sortWordsByDate,
  stripBold,
  truncateSentence,
  wordKey,
  type WordEntry,
} from '../src/core/words.ts';

const words: WordEntry[] = [
  {
    word: 'a',
    sentence: 'A.',
    source: 'Book',
    date: '2026-01-03',
    tags: ['noun'],
  },
  {
    word: 'b',
    sentence: 'B.',
    source: 'Paper',
    date: '2026-01-05',
    tags: ['verb', 'C1'],
  },
  { word: 'c', sentence: 'C.', source: 'Book', date: '2026-01-01' },
  { word: 'd', sentence: 'D.', date: '2026-01-04', tags: ['noun'] },
];

test('collectSources ranks by frequency then name, skips missing', () => {
  assert.deepEqual(collectSources(words), ['Book', 'Paper']);
  assert.deepEqual(collectSources([]), []);
});

test('collectTags flattens and ranks', () => {
  assert.deepEqual(collectTags(words), ['noun', 'C1', 'verb']);
});

test('filterWords by source, tag, both, none', () => {
  assert.deepEqual(
    filterWords(words, { source: 'Book', tag: null }).map((w) => w.word),
    ['a', 'c']
  );
  assert.deepEqual(
    filterWords(words, { source: null, tag: 'noun' }).map((w) => w.word),
    ['a', 'd']
  );
  assert.deepEqual(
    filterWords(words, { source: 'Book', tag: 'noun' }).map((w) => w.word),
    ['a']
  );
  assert.equal(filterWords(words, { source: null, tag: null }).length, 4);
  assert.equal(filterWords(words, { source: 'Nope', tag: null }).length, 0);
});

test('sortWordsByDate is newest-first and does not mutate', () => {
  const copy = [...words];
  assert.deepEqual(
    sortWordsByDate(words).map((w) => w.word),
    ['b', 'd', 'a', 'c']
  );
  assert.deepEqual(words, copy);
});

test('paginate clamps and reports 1-based range', () => {
  const items = Array.from({ length: 35 }, (_, i) => i);
  assert.deepEqual(paginate(items, 0, 16), {
    items: items.slice(0, 16),
    page: 0,
    totalPages: 3,
    from: 1,
    to: 16,
  });
  const last = paginate(items, 99, 16);
  assert.equal(last.page, 2);
  assert.equal(last.from, 33);
  assert.equal(last.to, 35);
  assert.equal(last.items.length, 3);
  assert.deepEqual(paginate([], 5, 16), {
    items: [],
    page: 0,
    totalPages: 0,
    from: 0,
    to: 0,
  });
  assert.equal(paginate(items, -3, 16).page, 0);
});

test('truncateSentence keeps short text, cuts long text at a word boundary', () => {
  assert.equal(truncateSentence('short', 10), 'short');
  const long = 'the quick brown fox jumps over the lazy dog again and again';
  const cut = truncateSentence(long, 20);
  assert.ok(cut.endsWith('…'));
  assert.ok(cut.length <= 21);
  assert.equal(cut, 'the quick brown fox…');
  // no spaces: hard cut
  assert.equal(truncateSentence('abcdefghijklmnop', 5), 'abcde…');
});

test('highlightWord marks inflections, case-insensitively, at word boundaries', () => {
  const segs = highlightWord('Runs run Running. Overrun is not.', 'run');
  assert.deepEqual(segs, [
    { text: 'Runs', match: true, start: 0 },
    { text: ' ', match: false, start: 4 },
    { text: 'run', match: true, start: 5 },
    { text: ' ', match: false, start: 8 },
    { text: 'Running', match: true, start: 9 },
    { text: '. Overrun is not.', match: false, start: 16 },
  ]);
  assert.deepEqual(highlightWord('nothing here', 'xyz'), [
    { text: 'nothing here', match: false, start: 0 },
  ]);
  assert.deepEqual(highlightWord('keep me', ''), [
    { text: 'keep me', match: false, start: 0 },
  ]);
  // regex metacharacters in the word must not throw
  assert.doesNotThrow(() => highlightWord('a (b) c', '(b)'));
});

test('highlightWord prefers explicit **bold** markers; offsets are in stripped text', () => {
  assert.deepEqual(highlightWord('They just **lashed** on them.', 'lash out'), [
    { text: 'They just ', match: false, start: 0 },
    { text: 'lashed', match: true, start: 10 },
    { text: ' on them.', match: false, start: 16 },
  ]);
  assert.deepEqual(highlightWord('**Go** now', 'go'), [
    { text: 'Go', match: true, start: 0 },
    { text: ' now', match: false, start: 2 },
  ]);
});

test('stripBold removes markers only', () => {
  assert.equal(stripBold('a **b** c'), 'a b c');
});

test('safeLink only accepts http(s)', () => {
  assert.equal(safeLink('https://example.com/x'), 'https://example.com/x');
  assert.equal(safeLink('http://example.com'), 'http://example.com');
  assert.equal(safeLink('javascript:alert(1)'), null);
  assert.equal(safeLink('not a url'), null);
  assert.equal(safeLink(undefined), null);
});

test('wordKey is date|word', () => {
  assert.equal(wordKey(words[0]), '2026-01-03|a');
});
