import { readdir } from 'node:fs/promises';
import { relative, resolve } from 'node:path';

const EXCLUDED_DIRECTORIES = new Set(['.git', 'node_modules', 'coverage', 'dist', 'build', 'test-results']);
export const MAPPING_LIMITS = Object.freeze({ maxDepth: 100, maxFiles: 10_000 });

/** Collect files below a mapping root while applying traversal safety limits. */
export async function collectMappingFiles(root, readDirectory = readdir) {
  const resolvedRoot = resolve(root);
  const visitedDirectories = new Set();
  const files = [];

  async function visit(directory, depth = 0) {
    if (depth > MAPPING_LIMITS.maxDepth) {
      throw new Error(`Source/test mapping traversal exceeded depth limit (${MAPPING_LIMITS.maxDepth}).`);
    }
    const resolvedDirectory = resolve(directory);
    if (visitedDirectories.has(resolvedDirectory)) return;
    visitedDirectories.add(resolvedDirectory);
    let entries;
    try {
      entries = await readDirectory(directory, { withFileTypes: true });
    } catch (error) {
      if (error.code === 'ENOENT') return;
      throw error;
    }
    const children = [...entries].sort((left, right) => left.name < right.name ? -1 : left.name > right.name ? 1 : 0);
    for (const entry of children) {
      if (entry.isSymbolicLink?.() || (entry.isDirectory() && EXCLUDED_DIRECTORIES.has(entry.name))) continue;
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) await visit(path, depth + 1);
      else if (entry.isFile()) files.push(relative(resolvedRoot, path).replaceAll('\\', '/'));
    }
  }

  await visit(resolvedRoot);
  if (files.length > MAPPING_LIMITS.maxFiles) {
    throw new Error(`Source/test mapping traversal exceeded file limit (${MAPPING_LIMITS.maxFiles}).`);
  }
  return new Set(files);
}
