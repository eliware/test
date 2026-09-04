import { readdir } from 'node:fs/promises';
import { extname, resolve } from 'node:path';

const SOURCE_EXTENSIONS = new Set(['.cjs', '.cts', '.js', '.jsx', '.mjs', '.mts', '.ts', '.tsx']);
const IGNORED_DIRECTORIES = new Set(['.git', 'node_modules', 'coverage', '.nyc_output', 'test-results', 'dist', 'build']);
export const POLICY_DISCOVERY_LIMITS = Object.freeze({ maxDepth: 100, maxFiles: 10_000 });
const compareNames = (left, right) => Number(left > right) - Number(left < right);

/** Discover supported workspace source files while excluding generated trees. */
export async function discoverPolicySources(cwd, readDirectory = readdir) {
  const root = resolve(cwd);
  const files = [];
  const visited = new Set();
  async function visit(directory, depth = 0) {
    if (depth > POLICY_DISCOVERY_LIMITS.maxDepth) throw new Error(`Policy discovery exceeded depth limit (${POLICY_DISCOVERY_LIMITS.maxDepth}).`);
    const normalized = resolve(directory);
    if (visited.has(normalized)) return;
    visited.add(normalized);
    for (const entry of [...await readDirectory(directory, { withFileTypes: true })].sort((left, right) => compareNames(left.name, right.name))) {
      const path = resolve(directory, entry.name);
      if (entry.isSymbolicLink?.()) continue;
      if (entry.isDirectory()) {
        if (!IGNORED_DIRECTORIES.has(entry.name)) await visit(path, depth + 1);
      } else if (entry.isFile()) {
        if (files.length >= POLICY_DISCOVERY_LIMITS.maxFiles) throw new Error(`Policy discovery exceeded file limit (${POLICY_DISCOVERY_LIMITS.maxFiles}).`);
        if (SOURCE_EXTENSIONS.has(extname(entry.name).toLowerCase())) files.push({ root, path });
      }
    }
  }
  await visit(root);
  return files;
}
