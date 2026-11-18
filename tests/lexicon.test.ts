import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  collectWordIndex,
  examplesForWord,
  findLexiconEntry,
  firstSense,
  isWordTag,
  parseLexiconEntry,
  plainText,
  searchWordIndex,
  sortWordIndex,
} from '../src/core/lexicon.ts';
import { parseWordPost } from '../src/core/wordPost.ts';

const stark = parseLexiconEntry(readFileSync('lexicon/stark.md', 'utf8'));
const deluge = parseLexiconEntry(readFileSync('lexicon/deluge.md', 'utf8'));
const starkPost = parseWordPost(
  readFileSync('words/2026-10-21-stark.md', 'utf8')
);
const glaringPost = parseWordPost(
  readFileSync('words/2026-10-21-glaring.md', 'utf8')
);

test('parseLexiconEntry reads frontmatter and the three named sections', () => {
  assert.equal(stark.word, 'stark');
  assert.deepEqual(stark.forms, ['stark', 'starkly', 'starkness']);
  assert.equal(stark.phoneticUk, '/stɑːk/');
  assert.deepEqual(stark.tags, ['六级', '考研', '托福']);
  assert.match(stark.senses ?? '', /鲜明的/);
  assert.match(stark.hooks ?? '', /史塔克/);
  assert.match(stark.phrases ?? '', /in stark contrast to/);
  assert.deepEqual(stark.extra, []);
  assert.match(deluge.hooks ?? '', /after me, the deluge/);
});

test('parseLexiconEntry requires a word', () => {
  assert.throws(() => parseLexiconEntry('## 常用义\n\n1. x'), /word/);
});

test('isWordTag: Latin words yes, labels no', () => {
  assert.equal(isWordTag('stark'), true);
  assert.equal(isWordTag('after me the deluge'), true);
  assert.equal(isWordTag('六级'), false);
  assert.equal(isWordTag('GRE'), false);
  assert.equal(isWordTag('每日一词'), false);
});

test('findLexiconEntry resolves any form to the entry', () => {
  assert.equal(findLexiconEntry([stark, deluge], 'Starkly')?.word, 'stark');
  assert.equal(findLexiconEntry([stark, deluge], 'deluged')?.word, 'deluge');
  assert.equal(findLexiconEntry([stark, deluge], 'glare'), undefined);
});

test('examplesForWord matches headword and word tags', () => {
  const posts = [starkPost, glaringPost];
  assert.deepEqual(
    examplesForWord(posts, [stark], 'starkness').map((p) => p.word),
    ['stark']
  );
  // glaring is tagged `glaring` `glare`; no lexicon entry needed
  assert.deepEqual(
    examplesForWord(posts, [], 'glare').map((p) => p.word),
    ['glaring']
  );
  assert.deepEqual(examplesForWord(posts, [stark, deluge], 'deluge'), []);
});

test('posts carry the series as their first tag', () => {
  assert.equal(starkPost.series, '每日一词');
  assert.equal(starkPost.tags?.[0], '每日一词');
});

test('collectWordIndex merges lexicon entries and post headwords', () => {
  const index = collectWordIndex([starkPost, glaringPost], [stark, deluge]);
  const byWord = Object.fromEntries(index.map((i) => [i.word, i]));
  assert.equal(byWord.stark.examples, 1);
  assert.equal(byWord.stark.hasEntry, true);
  assert.equal(byWord.glaring.hasEntry, false);
  assert.equal(byWord.deluge.examples, 0);
  // words with examples sort before entry-only words
  assert.equal(index[index.length - 1].word, 'deluge');
});

test('firstSense is the first 常用义 item as plain text', () => {
  assert.match(firstSense(stark) ?? '', /^adj\. 鲜明的、赤裸裸的/);
  assert.doesNotMatch(firstSense(stark) ?? '', /\*\*/);
  assert.equal(plainText('**a** `b` [c](http://x) *d*'), 'a b c d');
});

test('word index rows carry forms, labels and a sense', () => {
  const index = collectWordIndex([starkPost, glaringPost], [stark]);
  const byWord = Object.fromEntries(index.map((i) => [i.word, i]));
  assert.deepEqual(byWord.stark.forms, ['starkly', 'starkness']);
  assert.deepEqual(byWord.glaring.forms, ['glare']);
  assert.deepEqual(byWord.glaring.tags, ['六级', '考研', '托福']);
  assert.ok(byWord.glaring.sense && byWord.glaring.sense.length > 0);
});

test('searchWordIndex matches word, form, tag and sense; sort is stable', () => {
  const index = collectWordIndex([starkPost, glaringPost], [stark, deluge]);
  const words = (q: string) => searchWordIndex(index, q).map((i) => i.word);
  assert.deepEqual(words('glare'), ['glaring']);
  assert.deepEqual(words('史塔克'), ['stark']);
  assert.deepEqual(words('gre'), ['deluge']);
  assert.deepEqual(words('考研 glar'), ['glaring']);
  assert.deepEqual(
    words(''),
    index.map((i) => i.word)
  );
  assert.deepEqual(
    sortWordIndex(index, 'word', false).map((i) => i.word),
    ['deluge', 'glaring', 'stark']
  );
  assert.equal(sortWordIndex(index, 'examples', true)[2].word, 'deluge');
});
