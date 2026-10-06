import { readdir } from "node:fs/promises";
import { join, relative, sep } from "node:path";

const ignoredDirectories = new Set([".git", "node_modules", "coverage", "dist", "build"]);

export async function findMarkdownFiles(root, directory = root) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory() && !ignoredDirectories.has(entry.name))
      result.push(...(await findMarkdownFiles(root, path)));
    else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md"))
      result.push(relative(root, path).split(sep).join("/"));
  }
  return result.sort();
}
