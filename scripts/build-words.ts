/**
 * words/*.md  ->  src/static/words-index.json  +  public/data/articles/<slug>.json
 *
 * Each markdown file is one "外刊每日一词" post (see src/core/wordPost.ts for
 * the format). The index holds the list-level fields of every post and is
 * bundled with the app; the full post (body markdown, 解析, 近义词…) is written
 * one file per article and fetched only when that article is opened, so the
 * bundle does not grow with the archive.
 *
 * Run with: node --experimental-strip-types scripts/build-words.ts
 * Also wired as `pnpm words:build` and as the `prebuild` step, so CI rebuilds
 * both outputs from the posts on every deploy.
 *
 * Date fallback when a post has neither frontmatter `date` nor a
 * "YYYY 年 M 月 D 日" in its source line: a `YYYY-MM-DD` prefix on the file
 * name, else the file's mtime.
 */
import {
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import { format, resolveConfig } from 'prettier';
import { parseWordPost, type WordPost } from '../src/core/wordPost.ts';
import { postSlug } from '../src/core/articles.ts';
import { summarize } from '../src/core/articleIndex.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const postsDir = join(root, 'words');
const indexFile = join(root, 'src', 'static', 'words-index.json');
const articlesDir = join(root, 'public', 'data', 'articles');

const files = readdirSync(postsDir)
  .filter((f) => f.endsWith('.md'))
  .sort();

const posts: WordPost[] = [];
const failures: string[] = [];
for (const file of files) {
  const path = join(postsDir, file);
  const fromName = file.match(/^(\d{4}-\d{2}-\d{2})/)?.[1];
  const fallbackDate =
    fromName ?? statSync(path).mtime.toISOString().slice(0, 10);
  try {
    posts.push(parseWordPost(readFileSync(path, 'utf8'), { fallbackDate }));
  } catch (err) {
    failures.push(`${file}: ${(err as Error).message}`);
  }
}

if (failures.length) {
  console.error('build-words: failed to parse\n  ' + failures.join('\n  '));
  process.exit(1);
}

// Two posts with the same slug would overwrite each other's article file.
const seen = new Map<string, string>();
for (const post of posts) {
  const slug = postSlug(post);
  const prev = seen.get(slug);
  if (prev) failures.push(`${slug}: duplicate of ${prev}`);
  seen.set(slug, `${post.date} ${post.word}`);
}
if (failures.length) {
  console.error('build-words: duplicate slugs\n  ' + failures.join('\n  '));
  process.exit(1);
}

// One file per article, minified; the directory is rebuilt from scratch so
// renamed or deleted posts leave no stale file behind.
rmSync(articlesDir, { recursive: true, force: true });
mkdirSync(articlesDir, { recursive: true });
let articleBytes = 0;
for (const post of posts) {
  const json = JSON.stringify(post);
  articleBytes += Buffer.byteLength(json);
  writeFileSync(join(articlesDir, `${postSlug(post)}.json`), json);
}

// Same formatting as `pnpm check` expects, so the generated file never fails CI.
const prettierOptions = (await resolveConfig(indexFile)) ?? {};
const index = await format(JSON.stringify(posts.map(summarize)), {
  ...prettierOptions,
  filepath: indexFile,
});
writeFileSync(indexFile, index);
const kb = (n: number) => `${Math.round(n / 1024)} KB`;
console.log(
  `build-words: ${posts.length} posts -> ${indexFile} (${kb(Buffer.byteLength(index))}), ${articlesDir}/*.json (${kb(articleBytes)} total)`
);
