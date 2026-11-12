/**
 * words/*.md  ->  src/static/words.json
 *
 * Each markdown file is one "外刊每日一词" post (see src/core/wordPost.ts for
 * the format). Run with: node --experimental-strip-types scripts/build-words.ts
 * Also wired as `pnpm words:build` and as the `prebuild` step, so CI rebuilds
 * the JSON from the posts on every deploy.
 *
 * Date fallback when a post has neither frontmatter `date` nor a
 * "YYYY 年 M 月 D 日" in its source line: a `YYYY-MM-DD` prefix on the file
 * name, else the file's mtime.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import { format, resolveConfig } from 'prettier';
import { parseWordPost } from '../src/core/wordPost.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const postsDir = join(root, 'words');
const outFile = join(root, 'src', 'static', 'words.json');

const files = readdirSync(postsDir)
  .filter((f) => f.endsWith('.md'))
  .sort();

const entries = [];
const failures: string[] = [];
for (const file of files) {
  const path = join(postsDir, file);
  const fromName = file.match(/^(\d{4}-\d{2}-\d{2})/)?.[1];
  const fallbackDate =
    fromName ?? statSync(path).mtime.toISOString().slice(0, 10);
  try {
    entries.push(parseWordPost(readFileSync(path, 'utf8'), { fallbackDate }));
  } catch (err) {
    failures.push(`${file}: ${(err as Error).message}`);
  }
}

if (failures.length) {
  console.error('build-words: failed to parse\n  ' + failures.join('\n  '));
  process.exit(1);
}

// Same formatting as `pnpm check` expects, so the generated file never fails CI.
const prettierOptions = (await resolveConfig(outFile)) ?? {};
writeFileSync(
  outFile,
  await format(JSON.stringify(entries), {
    ...prettierOptions,
    filepath: outFile,
  })
);
console.log(`build-words: ${entries.length} posts -> ${outFile}`);
