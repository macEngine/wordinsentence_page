/**
 * Parser tests against the real post format.
 * Run: node --experimental-strip-types --test tests/
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  normalizeDate,
  parseFrontmatter,
  parseWordPost,
  splitSections,
} from '../src/core/wordPost.ts';

const here = dirname(fileURLToPath(import.meta.url));
const wrangling = readFileSync(
  join(here, '..', 'words', '2026-07-07-wrangling.md'),
  'utf8'
);

test('normalizeDate handles Chinese and ISO dates', () => {
  assert.equal(
    normalizeDate('《纽约时报》（2026 年 7 月 7 日刊）'),
    '2026-07-07'
  );
  assert.equal(normalizeDate('2026-11-08T15:03:00+08:00'), '2026-11-08');
  assert.equal(normalizeDate('no date here'), undefined);
  assert.equal(normalizeDate(undefined), undefined);
});

test('parseFrontmatter reads scalars and inline lists, leaves body intact', () => {
  const md = `---
title: "外刊每日一词：lash out"
word: "lash out"
date: 2026-11-08T15:03:00+08:00
tags: ["六级", "托福", "GRE"]
---
## 📖 词汇卡片
body`;
  const { data, body } = parseFrontmatter(md);
  assert.equal(data.word, 'lash out');
  assert.deepEqual(data.tags, ['六级', '托福', 'GRE']);
  assert.ok(body.startsWith('## 📖 词汇卡片'));
  assert.deepEqual(parseFrontmatter('no fm').data, {});
});

test('splitSections keys on heading text without emoji', () => {
  const sections = splitSections(wrangling);
  assert.deepEqual(
    [...sections.keys()],
    ['词汇卡片', '今日例句', '近义词辨析', '每日一句']
  );
  assert.ok(sections.get('每日一句')?.includes('Behind every calm agreement'));
  assert.ok(!sections.get('近义词辨析')?.includes('每日一句'));
});

test('parseWordPost on a post without frontmatter (owner sample)', () => {
  const e = parseWordPost(wrangling, { fallbackDate: '2099-01-01' });
  assert.equal(e.word, 'wrangling');
  assert.equal(
    e.date,
    '2026-07-07',
    'date comes from the source line, not the fallback'
  );
  assert.equal(e.articleDate, '2026-07-07');
  assert.equal(e.source, '纽约时报');
  assert.deepEqual(e.tags, ['托福', 'GRE']);
  assert.equal(e.phoneticUk, '/ˈræŋɡlɪŋ/');
  assert.equal(e.phoneticUs, '/ˈræŋɡlɪŋ/');
  assert.equal(e.image, 'https://blogimg.niuge6.com/i/4421705295567.png');
  assert.ok(e.sentence.startsWith('So you make a bid for "The Onion."'));
  assert.ok(
    e.sentence.includes('**wrangling**'),
    'bold marker kept for highlighting'
  );
  assert.ok(e.translation?.startsWith('于是你出价竞购'));
  assert.ok(!e.translation?.includes('**'), 'translation is plain text');
  assert.ok(e.meaning?.startsWith('wrangling 是动词 wrangle 的名词'));
  assert.ok(e.analysis?.includes('legal wrangling'));
  assert.ok(
    !e.analysis?.includes('翻译成中文是'),
    'translation paragraph excluded from analysis'
  );
  assert.equal(e.synonyms?.length, 4);
  assert.deepEqual(e.synonyms?.[1], {
    word: 'dispute',
    nuance: '纠纷、争端',
    example: 'a border dispute',
  });
  assert.ok(e.dailySentence?.text.startsWith('Behind every calm agreement'));
  assert.equal(e.dailySentence?.attribution, '改编自谈判实务随笔');
  assert.ok(e.dailySentence?.translation?.startsWith('每一份平静的协议背后'));
  assert.equal('link' in e, false, 'undefined fields are dropped');
});

test('frontmatter overrides body-derived fields', () => {
  const md = `---
title: "自定义标题"
word: "wrangle"
date: 2026-11-08T15:03:00+08:00
article_date: 2026-07-01
tags: ["六级"]
gloss: "扯皮"
---
${wrangling}`;
  const e = parseWordPost(md);
  assert.equal(e.word, 'wrangle');
  assert.equal(e.title, '自定义标题');
  assert.equal(e.date, '2026-11-08');
  assert.equal(e.articleDate, '2026-07-01');
  assert.deepEqual(e.tags, ['六级']);
  assert.equal(e.meaning, '扯皮');
});

test('parseWordPost fails loudly on posts without a quoted sentence or date', () => {
  assert.throws(
    () => parseWordPost('## 📖 词汇卡片\n\n**x**\n\n## 📰 今日例句\n\nnothing'),
    /no quoted sentence/
  );
  const undated =
    '## 📖 词汇卡片\n\n**x**\n\n## 📰 今日例句\n\n**x** 中出现的\n\n> quote **x**';
  assert.throws(() => parseWordPost(undated), /no date/);
  assert.equal(
    parseWordPost(undated, { fallbackDate: '2026-01-01' }).date,
    '2026-01-01'
  );
});
