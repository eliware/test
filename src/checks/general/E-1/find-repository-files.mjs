import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";

const excluded = new Set([".git", "node_modules", "coverage", "dist", "build", "test-results"]);

export async function findRepositoryFiles(root, readDirectory = readdir) {
  const files = [];
  async function visit(directory) {
    for (const entry of await readDirectory(directory, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!excluded.has(entry.name)) await visit(join(directory, entry.name));
      } else if (entry.isFile()) {
        files.push(relative(root, join(directory, entry.name)).replaceAll("\\", "/"));
      }
    }
  }
  await visit(root);
  return files;
}
