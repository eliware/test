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

export const jsonFiles = (root) => collect(root, root, (name) => name.endsWith(".json"));
export const repositoryFiles = (root) => collect(root, root, (name) => /\.(?:json|md)$/iu.test(name));
