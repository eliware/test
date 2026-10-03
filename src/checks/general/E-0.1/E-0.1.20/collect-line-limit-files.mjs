import { readdir } from "node:fs/promises";
import { basename, join } from "node:path";

export const excludedDirectories = new Set([
  ".git",
  "build",
  "coverage",
  "dist",
  "generated",
  "node_modules",
  "test-fixtures",
  "fixtures",
  "__fixtures__",
  "__snapshots__",
]);

export function excludedFile(file) {
  const name = basename(file);
  return name.endsWith(".d.mts") || name.endsWith(".snap.mjs") || name.includes(".generated");
}

export async function collectLineLimitFiles(directory, inventory = null) {
  if (inventory) {
    const repositoryRoot = inventory.root;
    const entries = await inventory.entriesUnder(directory, isLineLimitFile);
    return entries
      .filter(({ path, type }) => type === "file" && isLineLimitFile(path))
      .map(({ path }) => join(repositoryRoot, path));
  }
  const files = [];
  // Use an explicit stack so deeply nested trees do not recurse through the JavaScript call stack.
  const pendingDirectories = [directory];
  while (pendingDirectories.length > 0) {
    const currentDirectory = pendingDirectories.pop();
    for (const entry of await readdir(currentDirectory, { withFileTypes: true })) {
      const path = join(currentDirectory, entry.name);
      if (entry.isDirectory()) {
        if (!excludedDirectories.has(entry.name)) pendingDirectories.push(path);
      } else if (entry.isFile() && entry.name.endsWith(".mjs") && !excludedFile(path)) {
        files.push(path);
      }
    }
  }
  return files;
}

function isLineLimitFile(path) {
  const segments = path.split("/");
  return (
    path.endsWith(".mjs") &&
    !segments.some((segment) => excludedDirectories.has(segment)) &&
    !excludedFile(path)
  );
}
