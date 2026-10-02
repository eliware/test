import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";

const prunedDirectories = new Set([".git", "node_modules", "coverage", "dist", "build"]);

export async function collectRepositoryFiles(directory, root = directory, readDirectory = readdir) {
  const files = [];
  for (const entry of await readDirectory(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    const relativePath = relative(root, path).replaceAll("\\", "/");
    if (entry.isDirectory() && !(prunedDirectories.has(entry.name) && !relativePath.includes("/")))
      files.push(...(await collectRepositoryFiles(path, root, readDirectory)));
    else if (entry.isFile()) files.push(relativePath);
  }
  return files;
}
