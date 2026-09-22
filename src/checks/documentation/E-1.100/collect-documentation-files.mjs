import { readdir } from "node:fs/promises";
import { join } from "node:path";

async function collect(directory, root, predicate) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if ([".git", "node_modules", "coverage", "build", "dist"].includes(entry.name)) continue;
    const file = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collect(file, root, predicate));
    else if (entry.isFile() && predicate(entry.name)) files.push(file.slice(root.length + 1).replaceAll("\\", "/"));
  }
  return files;
}

const cache = new Map();
function cached(root, key, predicate) {
  const cacheKey = `${key}:${root}`;
  if (!cache.has(cacheKey)) cache.set(cacheKey, collect(root, root, predicate));
  return cache.get(cacheKey);
}
export const jsonFiles = (root) => cached(root, "json", (name) => name.endsWith(".json"));
export const repositoryFiles = (root) => cached(root, "repository", (name) => /\.(?:json|md)$/iu.test(name));
