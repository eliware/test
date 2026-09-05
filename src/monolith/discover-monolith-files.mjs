import { readdir } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { classifyMonolithFile } from './classify.mjs';

const IGNORED_DIRECTORIES = new Set(['node_modules', '.git', 'coverage', 'dist', 'build']);
const RELEVANT_ROOTS = new Set(['src', 'test', 'tests', 'spec', 'specs']);
const compareNames = (left, right) => Number(left > right) - Number(left < right);

export const MONOLITH_SCAN_LIMITS = Object.freeze({ maxDepth: 100 });

export async function discoverMonolithFiles(cwd, readDirectory = readdir) {
  const root = resolve(cwd);
  const candidates = [];
  const visited = new Set();
  async function visit(directory, depth = 0, relevant = false) {
    if (depth > MONOLITH_SCAN_LIMITS.maxDepth) throw new Error(`Monolith traversal exceeded depth limit (${MONOLITH_SCAN_LIMITS.maxDepth}).`);
    const normalized = resolve(directory);
    if (visited.has(normalized)) return;
    visited.add(normalized);
    for (const entry of [...await readDirectory(directory, { withFileTypes: true })].sort((left, right) => compareNames(left.name, right.name))) {
      if (entry.isSymbolicLink?.()) continue;
      if (entry.isDirectory()) {
        if (!IGNORED_DIRECTORIES.has(entry.name) && (relevant || directory !== root || RELEVANT_ROOTS.has(entry.name))) {
          await visit(resolve(directory, entry.name), depth + 1, relevant || directory === root);
        }
        continue;
      }
      if (!entry.isFile?.()) continue;
      const absolute = resolve(directory, entry.name);
      const file = relative(root, absolute).replaceAll('\\', '/');
      if (classifyMonolithFile(file)) candidates.push({ relative: file, absolute });
    }
  }
  await visit(root);
  return candidates;
}
