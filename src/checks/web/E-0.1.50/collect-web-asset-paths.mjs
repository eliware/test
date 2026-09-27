import { readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { matchesWebAssetExclusion } from "./matches-web-asset-exclusion.mjs";

export async function collectWebAssetPaths(directory, prefix = "", inventory, exclusions = []) {
  const entries = inventory
    ? await inventory.directoryEntries(directory)
    : await readdir(directory, { withFileTypes: true });
  const paths = [];
  for (const entry of entries) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    paths.push(path);
    if (
      entry.isDirectory() &&
      !exclusions.some((exclusion) => matchesWebAssetExclusion(path, exclusion))
    ) {
      paths.push(
        ...(await collectWebAssetPaths(
          resolve(directory, entry.name),
          path,
          inventory,
          exclusions,
        )),
      );
    }
  }
  return paths;
}
