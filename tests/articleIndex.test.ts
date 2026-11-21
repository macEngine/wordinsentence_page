import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseWordPost } from '../src/core/wordPost.ts';
import { summarize } from '../src/core/articleIndex.ts';
import { shortMeaning } from '../src/core/lexicon.ts';

const post = parseWordPost(readFileSync('words/2026-10-21-stark.md', 'utf8'));

test('summarize drops the article body and precomputes the gloss', () => {
  const s = summarize(post);
  assert.equal('markdown' in s, false);
  assert.equal('analysis' in s, false);
  assert.equal('synonyms' in s, false);
  assert.equal(s.word, 'stark');
  assert.equal(s.gloss, shortMeaning(post));
  assert.ok(s.synonymWords?.includes('stark'));
  // the index keeps only the sentence holding the word
  assert.ok(/\*\*stark\w*\*\*/.test(s.sentence));
  assert.ok(s.sentence.length <= post.sentence.length);
});

test('shortMeaning trusts a precomputed gloss', () => {
  assert.equal(shortMeaning({ word: 'x', gloss: '已算好' }), '已算好');
});
