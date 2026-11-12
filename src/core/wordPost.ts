/**
 * Parse one "外刊每日一词" blog post (markdown) into a WordEntry.
 *
 * The post format, in order:
 *   optional YAML-ish frontmatter (word / date / article_date / tags / gloss)
 *   ## 📖 词汇卡片     image, **word** 英 /…/ 美 /…/, `tag` `tag` or <code>tag</code>
 *   ## 📰 今日例句     source paragraph, > quote with **word** in bold, **解析：** paragraphs,
 *                     "那么回到…翻译成中文是：…" translation paragraph
 *   ## 🔄 近义词辨析   | 词汇 | 含义侧重 | 例句 | table
 *   ## 📝 每日一句     > quote（—— attribution）, （translation）
 *
 * Frontmatter wins when present; every field falls back to what can be read
 * from the body, so a post pasted without frontmatter still parses.
 * Pure function, no I/O: scripts/build-words.ts does the file reading.
 */
import { stripBold, type WordEntry } from './words.ts';

export interface Synonym {
  word: string;
  nuance: string;
  example: string;
}

export interface DailySentence {
  /** Keeps `**bold**` markers so the renderer can highlight. */
  text: string;
  attribution?: string;
  translation?: string;
}

export interface WordPost extends WordEntry {
  phoneticUk?: string;
  phoneticUs?: string;
  image?: string;
  /** Full source sentence, plain text, e.g. "wrangling 是《纽约时报》（2026 年 7 月 7 日刊）播客 "…" 中出现的一个单词". */
  sourceDetail?: string;
  /** Publication date of the article the word came from, `YYYY-MM-DD`. */
  articleDate?: string;
  /** Chinese translation of `sentence`. */
  translation?: string;
  /** 解析 paragraphs, plain text, joined by blank lines. */
  analysis?: string;
  synonyms?: Synonym[];
  dailySentence?: DailySentence;
}

export interface ParseOptions {
  /** Used for `date` when neither frontmatter nor the body gives one. */
  fallbackDate?: string;
}

/* ---------- small helpers ---------- */

function unquote(s: string): string {
  const t = s.trim();
  return (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
    ? t.slice(1, -1)
    : t;
}

function pad2(n: string): string {
  return n.padStart(2, '0');
}

/** "2026 年 7 月 7 日" -> "2026-07-07"; also accepts ISO dates / datetimes. */
export function normalizeDate(s: string | undefined): string | undefined {
  if (!s) return undefined;
  const cn = s.match(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
  if (cn) return `${cn[1]}-${pad2(cn[2])}-${pad2(cn[3])}`;
  const iso = s.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  return undefined;
}

/* ---------- frontmatter ---------- */

type Frontmatter = Record<string, string | string[]>;

export function parseFrontmatter(markdown: string): {
  data: Frontmatter;
  body: string;
} {
  const m = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { data: {}, body: markdown };
  const data: Frontmatter = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!kv) continue;
    const [, key, raw] = kv;
    const value = raw.trim();
    if (value.startsWith('[') && value.endsWith(']')) {
      data[key] = value
        .slice(1, -1)
        .split(',')
        .map((v) => unquote(v))
        .filter((v) => v.length > 0);
    } else {
      data[key] = unquote(value);
    }
  }
  return { data, body: markdown.slice(m[0].length) };
}

/* ---------- sections ---------- */

/** Split on `## ` headings; key is the heading text without emoji/whitespace. */
export function splitSections(body: string): Map<string, string> {
  const sections = new Map<string, string>();
  const re = /^##\s+(.+)$/gm;
  const heads: { key: string; end: number }[] = [];
  for (const m of body.matchAll(re)) {
    heads.push({
      key: m[1].replace(/[^\p{L}\p{N}\s]/gu, '').trim(),
      end: (m.index ?? 0) + m[0].length,
    });
  }
  heads.forEach((h, i) => {
    const next = heads[i + 1];
    const start = h.end;
    const stop = next
      ? body.lastIndexOf('\n## ', next.end) // start of next heading line
      : body.length;
    sections.set(h.key, body.slice(start, stop).trim());
  });
  return sections;
}

function paragraphs(text: string): string[] {
  return text
    .split(/\r?\n\s*\r?\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

function blockquote(text: string): string[] {
  return text
    .split(/\r?\n/)
    .filter((l) => l.trimStart().startsWith('>'))
    .map((l) => l.replace(/^\s*>\s?/, '').trim())
    .filter((l) => l.length > 0);
}

/* ---------- per-section parsers ---------- */

function parseCard(section: string | undefined) {
  if (!section) return {};
  const image = section.match(/!\[[^\]]*\]\(([^)]+)\)/)?.[1];
  const word = section.match(/\*\*([^*]+)\*\*/)?.[1]?.trim();
  const phoneticUk = section.match(/英\s*(\/[^/]+\/)/)?.[1];
  const phoneticUs = section.match(/美\s*(\/[^/]+\/)/)?.[1];
  const tags = [
    ...section.matchAll(/`([^`]+)`/g),
    ...section.matchAll(/<code>([^<]+)<\/code>/g),
  ].map((m) => m[1].trim());
  return { image, word, phoneticUk, phoneticUs, tags };
}

function parseExample(section: string | undefined) {
  if (!section) return {};
  const paras = paragraphs(section);
  const sourcePara = paras.find((p) => /中出现的/.test(p));
  const sourceDetail = sourcePara ? stripBold(sourcePara) : undefined;
  const source = sourceDetail?.match(/《([^》]+)》/)?.[1];
  const articleDate = normalizeDate(sourceDetail);
  const quoteLines = blockquote(section);
  const sentence = quoteLines.length ? quoteLines.join(' ') : undefined;

  const marker = paras.findIndex((p) => /^\*\*解析[：:]\*\*/.test(p));
  const translationIdx = paras.findIndex((p) => /翻译成中文是[：:]/.test(p));
  const analysisParas: string[] = [];
  if (marker >= 0) {
    const stop = translationIdx > marker ? translationIdx : paras.length;
    for (let i = marker; i < stop; i++) {
      const p = paras[i].replace(/^\*\*解析[：:]\*\*\s*/, '').trim();
      if (p) analysisParas.push(stripBold(p));
    }
  }
  const analysis = analysisParas.length
    ? analysisParas.join('\n\n')
    : undefined;
  const translation =
    translationIdx >= 0
      ? stripBold(paras[translationIdx].split(/翻译成中文是[：:]/)[1] ?? '')
          .trim()
          .replace(/^[“"]|[”"]$/g, '')
      : undefined;
  return { sourceDetail, source, articleDate, sentence, analysis, translation };
}

function parseSynonyms(section: string | undefined): Synonym[] | undefined {
  if (!section) return undefined;
  const rows: Synonym[] = [];
  for (const line of section.split(/\r?\n/)) {
    if (!line.trim().startsWith('|')) continue;
    const cells = line
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((c) => stripBold(c).trim());
    if (cells.length < 3) continue;
    if (/^-+$/.test(cells[0].replace(/\s/g, ''))) continue; // separator
    if (cells[0] === '词汇') continue; // header
    rows.push({ word: cells[0], nuance: cells[1], example: cells[2] });
  }
  return rows.length ? rows : undefined;
}

function parseDaily(section: string | undefined): DailySentence | undefined {
  if (!section) return undefined;
  const lines = blockquote(section);
  if (!lines.length) return undefined;
  const attributionIdx = lines.findIndex((l) => /^[—–-]{2}\s*/.test(l));
  const textLines =
    attributionIdx >= 0 ? lines.slice(0, attributionIdx) : lines;
  const attribution =
    attributionIdx >= 0
      ? lines[attributionIdx].replace(/^[—–-]{2}\s*/, '').trim()
      : undefined;
  const translation = paragraphs(section)
    .filter((p) => !p.trimStart().startsWith('>'))
    .map((p) => p.match(/^[（(]([\s\S]+)[）)]$/)?.[1])
    .find((p): p is string => !!p);
  return {
    text: textLines.join(' '),
    attribution,
    translation: translation ? stripBold(translation) : undefined,
  };
}

/* ---------- entry point ---------- */

export function parseWordPost(
  markdown: string,
  options: ParseOptions = {}
): WordPost {
  const { data, body } = parseFrontmatter(markdown);
  const sections = splitSections(body);
  const card = parseCard(sections.get('词汇卡片'));
  const example = parseExample(sections.get('今日例句'));
  const synonyms = parseSynonyms(sections.get('近义词辨析'));
  const dailySentence = parseDaily(sections.get('每日一句'));

  const fm = (k: string): string | undefined => {
    const v = data[k];
    return typeof v === 'string' && v.length ? v : undefined;
  };
  const fmTags = Array.isArray(data.tags) ? data.tags : undefined;

  const word = fm('word') ?? card.word;
  if (!word) throw new Error('parseWordPost: no word found');
  const sentence = example.sentence;
  if (!sentence) throw new Error(`parseWordPost(${word}): no quoted sentence`);

  const articleDate = normalizeDate(fm('article_date')) ?? example.articleDate;
  const date = normalizeDate(fm('date')) ?? articleDate ?? options.fallbackDate;
  if (!date) throw new Error(`parseWordPost(${word}): no date`);

  const entry: WordPost = {
    word,
    sentence,
    date,
    source: example.source,
    tags: fmTags ?? (card.tags?.length ? card.tags : undefined),
    meaning: fm('gloss') ?? fm('summary') ?? example.analysis?.split('\n\n')[0],
    phoneticUk: card.phoneticUk,
    phoneticUs: card.phoneticUs,
    image: card.image,
    sourceDetail: example.sourceDetail,
    articleDate,
    translation: example.translation,
    analysis: example.analysis,
    synonyms,
    dailySentence,
    link: fm('link'),
  };
  // drop undefined so the JSON stays compact
  return Object.fromEntries(
    Object.entries(entry).filter(([, v]) => v !== undefined)
  ) as WordPost;
}
