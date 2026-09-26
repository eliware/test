import { readdir } from "node:fs/promises";
import { join } from "node:path";

const excluded = new Set([".git", "coverage", "dist", "build", "node_modules"]);

export async function findSourceFiles(root, readDirectory = readdir) {
  const files = [];
  async function visit(directory) {
    for (const entry of await readDirectory(directory, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!excluded.has(entry.name)) await visit(join(directory, entry.name));
      } else if (entry.isFile() && /\.(?:mjs|js|cjs|ts|tsx)$/.test(entry.name)) {
        files.push(join(directory, entry.name));
      }
    }
  }
  await visit(root);
  return files;
}
