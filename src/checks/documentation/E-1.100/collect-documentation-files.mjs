import { readdir } from "node:fs/promises";
import { join } from "node:path";

async function collect(directory, root, predicate) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if ([".git", "node_modules", "coverage", "build", "dist"].includes(entry.name)) continue;
    const file = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...(await collect(file, root, predicate)));
    else if (entry.isFile() && predicate(entry.name)) result.push(file.slice(root.length + 1).replaceAll("\\", "/"));
  }
  return result;
}

const cache = new Map();

function cached(root, kind, predicate) {
  const key = `${kind}:${root}`;
  if (!cache.has(key)) cache.set(key, collect(root, root, predicate));
  return cache.get(key);
}

export const jsonFiles = (root) => cached(root, "json", (name) => name.endsWith(".json"));
export const repositoryFiles = (root) => cached(root, "repository", (name) => /\.(?:json|md)$/iu.test(name));
