import { readdir } from "node:fs/promises";
import { join } from "node:path";

export async function collectDocumentationFiles(directory, root = directory, predicate = () => true, { maxDepth = 32, maxFiles = 10_000 } = {}) {
  const files = [];
  async function visit(current, depth) {
    if (depth > maxDepth) throw new Error(`Documentation traversal exceeded the ${maxDepth}-level depth limit.`);
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries.toSorted((left, right) => left.name.localeCompare(right.name))) {
      if ([".git", "node_modules", "coverage", "build", "dist"].includes(entry.name)) continue;
      const file = join(current, entry.name);
      if (entry.isDirectory()) await visit(file, depth + 1);
      else if (entry.isFile() && predicate(entry.name)) {
        files.push(file.slice(root.length + 1).replaceAll("\\", "/"));
        if (files.length > maxFiles) throw new Error(`Documentation traversal exceeded the ${maxFiles}-file limit.`);
      }
    }
  }
  await visit(directory, 0);
  return files;
}

const cache = new Map();
function cached(root, key, predicate) {
  const cacheKey = `${key}:${root}`;
  if (!cache.has(cacheKey)) cache.set(cacheKey, collectDocumentationFiles(root, root, predicate));
  return cache.get(cacheKey);
}
export const jsonFiles = (root) => cached(root, "json", (name) => name.endsWith(".json"));
export const repositoryFiles = (root) => cached(root, "repository", (name) => /\.(?:json|md)$/iu.test(name));
