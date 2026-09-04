import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { IGNORED_DIRECTORIES } from './exclusion-patterns.mjs';
export const WALK_LIMITS = Object.freeze({ maxDepth: 100, maxFiles: 10_000 });
const compareNames = (left, right) => Number(left.name > right.name) - Number(left.name < right.name);

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
  const visited = new Set();
  let fileCount = 0;
  async function visit(directory, depth = 0) {
    if (depth > WALK_LIMITS.maxDepth) throw new Error(`Workspace traversal exceeded depth limit (${WALK_LIMITS.maxDepth}).`);
    const normalized = resolve(directory);
    if (visited.has(normalized)) return;
    visited.add(normalized);
    for (const entry of [...await readDirectory(directory, { withFileTypes: true })].sort(compareNames)) {
      if (entry.isSymbolicLink?.()) continue;
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) {
        if (!IGNORED_DIRECTORIES.has(entry.name)) await visit(path, depth + 1);
      } else if (entry.isFile()) {
        fileCount += 1;
        if (fileCount > WALK_LIMITS.maxFiles) throw new Error(`Workspace traversal exceeded file limit (${WALK_LIMITS.maxFiles}).`);
        await visitFile(path, entry);
      }
    }
  }
  await visit(resolve(cwd));
}
