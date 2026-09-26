import { readdir } from "node:fs/promises";
import { basename, join } from "node:path";

export const excludedDirectories = new Set([
  ".git", "build", "coverage", "dist", "generated", "node_modules", "test-fixtures", "fixtures", "__fixtures__", "__snapshots__",
]);

export function excludedFile(file) {
  const name = basename(file);
  return name.endsWith(".d.mts") || name.endsWith(".snap.mjs") || name.includes(".generated.");
}

export async function collectMonolithFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!excludedDirectories.has(entry.name)) files.push(...await collectMonolithFiles(path));
    } else if (entry.isFile() && entry.name.endsWith(".mjs") && !excludedFile(path)) files.push(path);
  }
  return files;
}
