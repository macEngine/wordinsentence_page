import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  ALL_ARTICLES_FILTER,
  collectYears,
  filterArticles,
  findBySlug,
  postSlug,
  queryTerms,
  splitArticle,
  toggleTag,
} from '../src/core/articles.ts';
import type { WordPost } from '../src/core/wordPost.ts';

const post = (over: Partial<WordPost>): WordPost => ({
  word: 'w',
  sentence: 'S',
  date: '2026-01-01',
  markdown: '',
  ...over,
});
const posts: WordPost[] = [
  post({
    word: 'wrangling',
    date: '2026-07-07',
    source: '纽约时报',
    tags: ['托福', 'GRE'],
    sentence: 'legal **wrangling**',
    meaning: '扯皮',
  }),
  post({
    word: 'lash out',
    date: '2026-06-24',
    source: '纽约时报',
    tags: ['六级', '托福'],
    sentence: 'They **lashed** on them.',
  }),
  post({
    word: 'leash',
    date: '2025-12-31',
    source: '经济学人',
    tags: ['GRE'],
    synonyms: [{ word: 'tether', nuance: '', example: '' }],
  }),
];

test('collectYears newest first, distinct', () => {
  assert.deepEqual(collectYears(posts), [2026, 2025]);
});

test('queryTerms lowercases and splits on whitespace', () => {
  assert.deepEqual(queryTerms('  Legal   GRE '), ['legal', 'gre']);
  assert.deepEqual(queryTerms(''), []);
});

test('filterArticles: year / source / tags(AND) / query(AND)', () => {
  const words = (f: Partial<typeof ALL_ARTICLES_FILTER>) =>
    filterArticles(posts, { ...ALL_ARTICLES_FILTER, ...f }).map((p) => p.word);
  assert.deepEqual(words({}), ['wrangling', 'lash out', 'leash']);
  assert.deepEqual(words({ year: 2025 }), ['leash']);
  assert.deepEqual(words({ source: '纽约时报' }), ['wrangling', 'lash out']);
  assert.deepEqual(words({ tags: ['托福'] }), ['wrangling', 'lash out']);
  assert.deepEqual(words({ tags: ['托福', 'GRE'] }), ['wrangling']);
  assert.deepEqual(words({ query: 'legal' }), ['wrangling']);
  assert.deepEqual(words({ query: 'gre 纽约' }), ['wrangling']);
  assert.deepEqual(
    words({ query: 'tether' }),
    ['leash'],
    'synonyms are searchable'
  );
  assert.deepEqual(
    words({ query: '扯皮' }),
    ['wrangling'],
    'meaning is searchable'
  );
  assert.deepEqual(
    words({ query: 'LASHED' }),
    ['lash out'],
    'case-insensitive'
  );
  assert.deepEqual(words({ query: 'nope' }), []);
});

test('toggleTag adds then removes', () => {
  assert.deepEqual(toggleTag([], 'a'), ['a']);
  assert.deepEqual(toggleTag(['a', 'b'], 'a'), ['b']);
});

test('postSlug is date + lowercase word, phrases hyphenated', () => {
  assert.equal(postSlug(posts[0]), '2026-07-07-wrangling');
  assert.equal(postSlug(posts[1]), '2026-06-24-lash-out');
  assert.equal(
    postSlug(post({ word: 'Déjà vu!', date: '2026-01-02' })),
    '2026-01-02-d-j-vu'
  );
  assert.equal(findBySlug(posts, '2026-06-24-lash-out')?.word, 'lash out');
  assert.equal(findBySlug(posts, 'nope'), undefined);
});

test('splitArticle splits on ## headings and keeps bodies', () => {
  const md =
    'intro\n\n## 📖 词汇卡片\n\n![](x.png)\n\n**w**\n\n## 📰 今日例句\n\n> quote\n\n## 🔄 近义词辨析\n\n| a | b |\n';
  assert.deepEqual(splitArticle(md), [
    { title: '', body: 'intro' },
    { title: '📖 词汇卡片', body: '![](x.png)\n\n**w**' },
    { title: '📰 今日例句', body: '> quote' },
    { title: '🔄 近义词辨析', body: '| a | b |' },
  ]);
  assert.deepEqual(splitArticle('just text'), [
    { title: '', body: 'just text' },
  ]);
  assert.deepEqual(splitArticle(''), []);
});
