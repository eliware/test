import { readdir, readFile } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { measureMonolithFile } from './measure-file.mjs';
import { classifyMonolithFile } from './classify.mjs';

const IGNORED_DIRECTORIES = new Set(['node_modules', '.git', 'coverage', 'dist', 'build']);
export const MONOLITH_SCAN_LIMITS = Object.freeze({ maxDepth: 100 });
export const DEFAULT_MEASUREMENT_WORKERS = 6;
const compareNames = (left, right) => Number(left > right) - Number(left < right);
const RELEVANT_ROOTS = new Set(['src', 'test', 'tests', 'spec', 'specs']);

/** Traverse a workspace and measure files eligible for monolith policy checks. */
export async function scanMonolithFiles(cwd, readDirectory = readdir, readSource = readFile, workers = DEFAULT_MEASUREMENT_WORKERS) {
  if (!Number.isInteger(workers) || workers <= 0) throw new TypeError('scanMonolithFiles workers must be a positive integer');
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
        if (!IGNORED_DIRECTORIES.has(entry.name)
          && (relevant || directory !== root || RELEVANT_ROOTS.has(entry.name))) {
          await visit(resolve(directory, entry.name), depth + 1, relevant || directory === root);
        }
        continue;
      }
      if (!entry.isFile()) continue;
      const absolute = resolve(directory, entry.name);
      const file = relative(root, absolute).replaceAll('\\', '/');
      if (classifyMonolithFile(file)) candidates.push({ relative: file, absolute });
    }
  }
  await visit(root);
  const measured = Array.from({ length: candidates.length });
  let next = 0;
  if (candidates.length === 1) return [await measureMonolithFile(candidates[0], readSource)];
  async function worker() {
    while (next < candidates.length) {
      const index = next; next += 1;
      const result = await measureMonolithFile(candidates[index], readSource);
      measured[index] = result;
    }
  }
  await Promise.all(Array.from({ length: Math.min(workers, candidates.length) }, worker));
  return measured;
}
