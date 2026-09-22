import { readdir } from "node:fs/promises";
import { join } from "node:path";

async function collect(directory, root, predicate) {
  const entries = await readdir(directory, { withFileTypes: true });
  const batches = await Promise.all(entries
    .filter((entry) => ![".git", "node_modules", "coverage", "build", "dist"].includes(entry.name))
    .map(async (entry) => {
      const file = join(directory, entry.name);
      if (entry.isDirectory()) return collect(file, root, predicate);
      if (entry.isFile() && predicate(entry.name)) return [file.slice(root.length + 1).replaceAll("\\", "/")];
      return [];
    }));
  return batches.flat();
}

const cache = new Map();
function cached(root, key, predicate) {
  const cacheKey = `${key}:${root}`;
  if (!cache.has(cacheKey)) cache.set(cacheKey, collect(root, root, predicate));
  return cache.get(cacheKey);
}
export const jsonFiles = (root) => cached(root, "json", (name) => name.endsWith(".json"));
export const repositoryFiles = (root) => cached(root, "repository", (name) => /\.(?:json|md)$/iu.test(name));
