import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { IGNORED_DIRECTORIES } from './exclusion-patterns.mjs';

/** Walk workspace files depth-first, skipping standard excluded directories. */
export async function walkFiles(cwd, visitFile, options = {}) {
  if (typeof cwd !== 'string' || cwd.length === 0) {
    throw new TypeError('walkFiles requires a working-directory path');
  }
  if (typeof visitFile !== 'function') {
    throw new TypeError('walkFiles requires a file visitor');
  }
  if (options === null || typeof options !== 'object') {
    throw new TypeError('walkFiles options must be an object');
  }

  const readDirectory = options.readDirectory ?? readdir;
  async function visit(directory) {
    for (const entry of await readDirectory(directory, { withFileTypes: true })) {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) {
        if (!IGNORED_DIRECTORIES.has(entry.name)) await visit(path);
      } else if (entry.isFile()) await visitFile(path, entry);
    }
  }
  await visit(resolve(cwd));
}
