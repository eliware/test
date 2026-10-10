import { readdir } from "node:fs/promises";
import { join, relative, sep } from "node:path";

const ignoredDirectories = new Set([".git", "node_modules", "coverage", "dist", "build"]);
const maxDepth = 128;
const maxEntries = 10_000;

export async function findMarkdownFiles(root, directory = root, readDirectory = readdir) {
  const result = [];
  const pending = [{ path: directory, depth: 0 }];
  let entryCount = 0;
  while (pending.length) {
    const current = pending.pop();
    if (current.depth > maxDepth)
      throw new Error(`Markdown traversal exceeded the ${maxDepth}-level depth limit.`);
    for (const entry of await readDirectory(current.path, { withFileTypes: true })) {
      entryCount += 1;
      if (entryCount > maxEntries)
        throw new Error(`Markdown traversal exceeded the ${maxEntries}-entry limit.`);
      if (entry.isDirectory() && !ignoredDirectories.has(entry.name))
        pending.push({ path: join(current.path, entry.name), depth: current.depth + 1 });
      else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md"))
        result.push(relative(root, join(current.path, entry.name)).split(sep).join("/"));
    }
  }
  return result.sort();
}
