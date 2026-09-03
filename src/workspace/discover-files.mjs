import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const IGNORED_DIRECTORIES = new Set(['.git', 'node_modules', 'coverage', '.nyc_output', 'test-results', 'dist', 'build']);

/** Discover workspace files while excluding generated/dependency directories. */
export async function discoverFiles(cwd, { predicate = () => true, readDirectory } = {}) {
  if (typeof cwd !== 'string' || cwd.length === 0) {
    throw new TypeError('discoverFiles requires a working-directory path');
  }
  if (typeof predicate !== 'function') {
    throw new TypeError('discoverFiles predicate must be a function');
  }

  const files = [];
  const read = readDirectory ?? readdir;
  async function visit(directory) {
    for (const entry of await read(directory, { withFileTypes: true })) {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) {
        if (!IGNORED_DIRECTORIES.has(entry.name)) await visit(path);
      } else if (entry.isFile() && predicate(path, entry)) files.push(path);
    }
  }
  await visit(resolve(cwd));
  return files;
}
