import { readdir, readFile } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { measureMonolithFile } from './measure-file.mjs';

const IGNORED_DIRECTORIES = new Set(['node_modules', '.git', 'coverage', 'dist', 'build']);

/** Traverse a workspace and measure files eligible for monolith policy checks. */
export async function scanMonolithFiles(cwd, readDirectory = readdir, readSource = readFile) {
  const root = resolve(cwd);
  const files = [];
  async function visit(directory) {
    for (const entry of await readDirectory(directory, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!IGNORED_DIRECTORIES.has(entry.name)) await visit(resolve(directory, entry.name));
        continue;
      }
      if (!entry.isFile()) continue;
      const absolute = resolve(directory, entry.name);
      const file = relative(root, absolute).replaceAll('\\', '/');
      const measured = await measureMonolithFile({ relative: file, absolute }, readSource);
      if (measured) files.push(measured);
    }
  }
  await visit(root);
  return files;
}
