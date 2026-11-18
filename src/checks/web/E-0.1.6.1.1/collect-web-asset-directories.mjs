import { readdir } from "node:fs/promises";
import { relative, resolve, sep } from "node:path";
import findIgnoredRepositoryPaths from "../../../validation/shared/repository/find-repository-files/find/ignored-repository-paths.mjs";
import isIgnoredRepositoryPath from "../../../validation/shared/repository/repository-inventory/path-filters/is/ignored-repository-path.mjs";
const excludedDirectories = new Set(["dist", "build", "coverage", "node_modules", ".git"]);
export default async function collectWebAssetDirectories(directory, inventory, dependencies = {}) {
  const readDirectory = dependencies.readDirectory ?? readdir;
  const root = inventory?.root ?? resolve(directory, "..");
  const ignoredPaths = dependencies.ignoredPaths ?? (await findIgnoredRepositoryPaths(root));
  const found = [];
  async function visit(current, prefix) {
    const entries = inventory
      ? await inventory.directoryEntries(current)
      : await readDirectory(current, {
          withFileTypes: true,
        });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const path = prefix ? `${prefix}/${entry.name}` : entry.name;
      const repositoryPath = relative(root, resolve(current, entry.name)).split(sep).join("/");
      if (isIgnoredRepositoryPath(repositoryPath, ignoredPaths)) continue;
      if (excludedDirectories.has(entry.name)) found.push(path);
      else await visit(resolve(current, entry.name), path);
    }
  }
  await visit(directory, "");
  return found;
}
