import type { WordPost } from './wordPost.ts';
import { clipExample, shortMeaning } from './lexicon.ts';

/**
 * The list-level view of a post: everything the home list, tag pages, the
 * words table and the word page need, without the article body. The build
 * writes these to `src/static/words-index.json` (bundled); the full posts go
 * to `public/data/articles/<slug>.json` and are fetched when an article opens.
 */
export type WordPostSummary = Omit<
  WordPost,
  | 'markdown'
  | 'analysis'
  | 'synonyms'
  | 'dailySentence'
  | 'sourceDetail'
  | 'articleDate'
> & {
  /** `shortMeaning` precomputed at build time, since 解析 is not in the index. */
  gloss?: string;
  /** Just the words of 近义词辨析, for search. */
  synonymWords?: string[];
};

/** Longest `meaning` kept in the index; the list shows at most 40 chars of it. */
const MEANING_MAX = 80;

export function summarize(post: WordPost): WordPostSummary {
  const {
    markdown: _markdown,
    analysis: _analysis,
    synonyms,
    dailySentence: _dailySentence,
    sourceDetail: _sourceDetail,
    articleDate: _articleDate,
    ...rest
  } = post;
  const gloss = shortMeaning(post);
  return {
    ...rest,
    // The one sentence holding the word (bold kept): what the list preview and
    // the word page's example index show. The full quote is in the article file.
    sentence: clipExample(rest.sentence, rest.word),
    meaning:
      rest.meaning && rest.meaning.length > MEANING_MAX
        ? rest.meaning.slice(0, MEANING_MAX)
        : rest.meaning,
    ...(gloss ? { gloss } : {}),
    ...(synonyms?.length ? { synonymWords: synonyms.map((x) => x.word) } : {}),
  };
}
