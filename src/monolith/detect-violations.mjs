import { readdir, readFile } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { readMonolithConfig } from './config.mjs';
import { classifyMonolithFile, isPureBarrel } from './classify.mjs';
import { filterMonolithViolations } from './filter.mjs';

const IGNORED_DIRECTORIES = new Set(['node_modules', '.git', 'coverage', 'dist', 'build']);

/** Discover source/test files and return those exceeding their configured limits. */
export async function detectViolations(cwd, options = {}) {
  if (typeof cwd !== 'string' || cwd.length === 0) {
    throw new TypeError('detectViolations requires a working-directory path');
  }
  if (options === null || typeof options !== 'object') {
    throw new TypeError('detectViolations options must be an object');
  }
  const config = await readMonolithConfig(cwd, options.readFilePath ?? readFile);
  const files = [];
  await visit(resolve(cwd), resolve(cwd), files, options.readDirectory ?? readdir, options.readSource ?? readFile);
  return filterMonolithViolations(files, config);
}

async function visit(root, directory, files, readDirectory, readSource) {
  for (const entry of await readDirectory(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!IGNORED_DIRECTORIES.has(entry.name)) await visit(root, resolve(directory, entry.name), files, readDirectory, readSource);
      continue;
    }
    if (!entry.isFile()) continue;
    const file = relative(root, resolve(directory, entry.name)).replaceAll('\\', '/');
    const kind = classifyMonolithFile(file);
    if (!kind) continue;
    const source = await readSource(resolve(directory, entry.name), 'utf8');
    files.push({ file, kind, lines: source.length ? source.replace(/\r\n/g, '\n').replace(/\n$/, '').split('\n').length : 0, generated: /(?:^|\/)(?:generated)(?:\/|$)|\.generated\.|@generated\b/i.test(`${file}\n${source}`), pureBarrel: kind === 'source' && isPureBarrel(source) });
  }
}
