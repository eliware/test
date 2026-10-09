import { readdir } from "node:fs/promises";
import { resolve } from "node:path";

const excludedDirectories = new Set(["dist", "build", "coverage", "node_modules", ".git"]);

export async function collectWebAssetDirectories(directory, inventory, dependencies = {}) {
  const readDirectory = dependencies.readDirectory ?? readdir;
  const found = [];
  async function visit(current, prefix) {
    const entries = inventory
      ? await inventory.directoryEntries(current)
      : await readDirectory(current, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const path = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (excludedDirectories.has(entry.name)) found.push(path);
      else await visit(resolve(current, entry.name), path);
    }
  }
  await visit(directory, "");
  return found;
}
