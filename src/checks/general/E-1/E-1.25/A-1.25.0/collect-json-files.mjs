import { readdir } from "node:fs/promises";
import { join } from "node:path";

const ignoredDirectories = new Set([".git", "node_modules", "coverage", "build", "dist"]);

export async function collectJsonFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && !ignoredDirectories.has(entry.name)) {
      files.push(...(await collectJsonFiles(join(directory, entry.name))));
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      files.push(join(directory, entry.name));
    }
  }
  return files.sort((left, right) => left.localeCompare(right));
}
