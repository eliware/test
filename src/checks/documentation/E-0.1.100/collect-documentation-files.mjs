import { readdir } from "node:fs/promises";
import { join } from "node:path";

export async function collectDocumentationFiles(
  directory,
  root = directory,
  predicate = () => true,
  { maxDepth = 32, maxFiles = 10_000 } = {},
) {
  const files = [];
  const directories = [{ path: directory, depth: 0, entries: null, index: 0 }];
  while (directories.length > 0) {
    const currentDirectory = directories.at(-1);
    const { path: current, depth } = currentDirectory;
    if (depth > maxDepth)
      throw new Error(`Documentation traversal exceeded the ${maxDepth}-level depth limit.`);
    currentDirectory.entries ??= (await readdir(current, { withFileTypes: true })).toSorted(
      (left, right) => left.name.localeCompare(right.name),
    );
    if (currentDirectory.index >= currentDirectory.entries.length) {
      directories.pop();
      continue;
    }
    const entry = currentDirectory.entries[currentDirectory.index];
    currentDirectory.index += 1;
    if ([".git", "node_modules", "coverage", "build", "dist"].includes(entry.name)) continue;
    const file = join(current, entry.name);
    if (entry.isDirectory())
      directories.push({ path: file, depth: depth + 1, entries: null, index: 0 });
    else if (entry.isFile() && predicate(entry.name)) {
      files.push(file.slice(root.length + 1).replaceAll("\\", "/"));
      if (files.length > maxFiles)
        throw new Error(`Documentation traversal exceeded the ${maxFiles}-file limit.`);
    }
  }
  return files;
}
