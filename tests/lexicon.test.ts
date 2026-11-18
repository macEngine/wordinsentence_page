import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  clipExample,
  collectWordIndex,
  examplesForWord,
  findLexiconEntry,
  firstSense,
  formsWithExamples,
  hookItems,
  isWordTag,
  parseLexiconEntry,
  phraseExamples,
  phraseItems,
  phraseRegex,
  plainText,
  searchWordIndex,
  senseItems,
  senseList,
  shortMeaning,
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
  assert.match(deluge.phrases ?? '', /after me, the deluge/);
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
  // starkly / starkness never appear in a post -> not listed
  assert.deepEqual(byWord.stark.forms, []);
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

test('senseList keeps only the gloss label of each 常用义 item', () => {
  assert.deepEqual(senseList(stark), [
    'adj. 鲜明的、赤裸裸的',
    'adj. 荒凉的、光秃秃的、冷峭的',
    'adj. 严酷的、毫不留情的',
    'adv. 完全地',
  ]);
});

test('shortMeaning reads the headword row of 近义词辨析', () => {
  assert.equal(shortMeaning(glaringPost), '显眼到无法忽视，多指错误、问题');
  assert.equal(shortMeaning(starkPost), '差别明摆着、不容忽视，常带严峻意味');
});

test('shortMeaning matches a multi-word headword row exactly', () => {
  const buckUp = parseWordPost(
    readFileSync('words/2026-10-22-buck-up.md', 'utf8')
  );
  assert.equal(shortMeaning(buckUp), '振作起来；给……打气');
  const lo = parseWordPost(
    readFileSync('words/2026-10-22-lo-and-behold.md', 'utf8')
  );
  assert.ok(shortMeaning(lo)?.startsWith('引出意外或应验的事'));
});

test('clipExample keeps the one sentence holding the bold word', () => {
  const s = 'First one. They carry **caveats** in a way. Third one.';
  assert.equal(clipExample(s, 'caveat'), 'They carry **caveats** in a way.');
  // long sentence -> window around the hit with ellipses
  const long =
    'a b c d e f g h i j k l m n o p q r s t **word** u v w x y z aa bb cc dd ee ff gg hh ii jj kk ll mm nn oo pp qq rr';
  const clipped = clipExample(long, 'word', 40);
  assert.ok(clipped.startsWith('…') && clipped.endsWith('…'));
  assert.ok(clipped.includes('**word**'));
  assert.ok(clipped.length < long.length);
});

test('hookItems: emoji + bold headline, short note', () => {
  const items = hookItems(deluge);
  assert.equal(items.length, 3);
  assert.equal(items[0].title, '🌊 圣经大洪水 the Deluge');
  assert.equal(items[0].note, '诺亚方舟那场。不是下雨，是把一切冲走。');
  assert.equal(items[1].title, '👑 Après moi, le déluge');
  assert.deepEqual(
    hookItems(
      parseLexiconEntry('---\nword: x\n---\n## 一眼记住\n- plain line')
    ),
    [{ title: 'plain line' }]
  );
});

test('formsWithExamples lists only forms seen in posts', () => {
  // stark's forms starkly / starkness never appear -> nothing to show
  assert.deepEqual(formsWithExamples([starkPost], [stark], 'stark'), []);
  // glaring is tagged `glare` on its post -> glare shows with count 1
  assert.deepEqual(formsWithExamples([glaringPost], [], 'glaring'), []);
  const glaringEntry = parseLexiconEntry(
    '---\nword: glaring\nforms: [glaring, glare]\n---\n'
  );
  assert.deepEqual(
    formsWithExamples([glaringPost], [glaringEntry], 'glaring'),
    [{ form: 'glare', count: 1 }]
  );
});

test('senseItems splits the bold label from the detail', () => {
  const items = senseItems(stark);
  assert.equal(items[0].label, 'adj. 鲜明的、赤裸裸的');
  assert.match(items[0].detail ?? '', /^（对比、现实、数据/);
  assert.match(items[0].detail ?? '', /a stark contrast/);
  assert.equal(items.length, 4);
});

test('phraseItems and phraseExamples link phrases to the sentences using them', () => {
  const items = phraseItems(deluge);
  assert.equal(items[0].phrase, 'a deluge of');
  assert.equal(items[0].meaning, '… 大量涌来的……');
  const posts = [
    { sentence: 'The office **was deluged** with calls.' },
    { sentence: 'It stands in stark contrast to last year.' },
    { sentence: 'An office often has calls.' },
  ] as Parameters<typeof phraseExamples>[0];
  assert.equal(phraseExamples(posts, 'be deluged with …').length, 1);
  assert.equal(phraseExamples(posts, 'in stark contrast to …').length, 1);
  // short words match exactly: "a … of" must not hit "an … often"
  assert.equal(phraseExamples(posts, 'a deluge of …').length, 0);
  // alternatives share the head: "the stark reality / truth"
  assert.match('the stark truth', phraseRegex('the stark reality / truth')!);
  assert.equal(phraseRegex('…'), null);
});
