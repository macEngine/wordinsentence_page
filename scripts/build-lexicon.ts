/**
 * lexicon/*.md  ->  src/static/lexicon.json
 *
 * One file per word (see src/core/lexicon.ts for the format). Run with
 * `pnpm lexicon:build`; also part of `prebuild`, so CI regenerates the JSON.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import { format, resolveConfig } from 'prettier';
import { parseLexiconEntry, type LexiconEntry } from '../src/core/lexicon.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'lexicon');
const outFile = join(root, 'src', 'static', 'lexicon.json');

const files = existsSync(dir)
  ? readdirSync(dir)
      .filter((f) => f.endsWith('.md'))
      .sort()
  : [];

const entries: LexiconEntry[] = [];
const failures: string[] = [];
const seen = new Map<string, string>();
for (const file of files) {
  try {
    const entry = parseLexiconEntry(readFileSync(join(dir, file), 'utf8'));
    for (const form of entry.forms) {
      const other = seen.get(form);
      if (other) failures.push(`${file}: form "${form}" already in ${other}`);
      seen.set(form, file);
    }
    entries.push(entry);
  } catch (err) {
    failures.push(`${file}: ${(err as Error).message}`);
  }
}

if (failures.length) {
  console.error('build-lexicon: failed\n  ' + failures.join('\n  '));
  process.exit(1);
}

const prettierOptions = (await resolveConfig(outFile)) ?? {};
writeFileSync(
  outFile,
  await format(JSON.stringify(entries), {
    ...prettierOptions,
    filepath: outFile,
  })
);
console.log(`build-lexicon: ${entries.length} entries -> ${outFile}`);
