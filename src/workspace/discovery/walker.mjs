import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { IGNORED_DIRECTORIES } from './exclusions.mjs';
export async function walkWorkspace(cwd, visitFile, { readDirectory = readdir } = {}) {
  async function visit(directory) {
    for (const entry of await readDirectory(directory, { withFileTypes: true })) {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) { if (!IGNORED_DIRECTORIES.has(entry.name)) await visit(path); }
      else if (entry.isFile()) await visitFile(path, entry);
    }
  }
  await visit(resolve(cwd));
}
