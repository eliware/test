import { readdir } from "node:fs/promises";
import { join } from "node:path";

const excluded = new Set([".git", "coverage", "dist", "build", "node_modules"]);

export async function discoverSourceFiles(directory, readDirectory = readdir) {
  const files = [];
  for (const entry of await readDirectory(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!excluded.has(entry.name)) {
        files.push(...(await discoverSourceFiles(join(directory, entry.name), readDirectory)));
      }
    } else if (entry.isFile() && entry.name.endsWith(".mjs")) {
      files.push(join(directory, entry.name));
    }
  }
  return files;
}
