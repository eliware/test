import { basename, dirname } from "node:path";
import { inventoryDirectory } from "./repository-inventory-paths.mjs";
import { createRepositoryEntryIndex } from "./create-repository-entry-index.mjs";
import { readGeneratedDirectoryRecords } from "./read-generated-directory-records.mjs";

export function createRepositoryDirectoryEntries({
  root,
  entries,
  entriesUnder,
  readDirectory,
  hasFullDiscovery,
}) {
  let index;
  let indexedRecords;
  return async function directoryEntries(directory) {
    const base = inventoryDirectory(
      root,
      directory,
      "Repository inventory directory must be inside the repository.",
    );
    if (base && !hasFullDiscovery()) {
      const records = await entriesUnder(directory);
      if (!records.some((record) => record.path === base)) {
        throw Object.assign(new Error(`ENOENT: no such directory, scandir '${directory}'`), {
          code: "ENOENT",
        });
      }
      return records
        .filter((record) => dirname(record.path).replaceAll("\\", "/") === base)
        .map((record) => ({
          name: basename(record.path),
          path: record.path,
          isFile: () => record.type === "file",
          isDirectory: () => record.type === "directory",
        }));
    }
    const records = await entries();
    if (indexedRecords !== records) {
      indexedRecords = records;
      index = createRepositoryEntryIndex(records);
    }
    const knownDirectory = index.knownDirectories.has(base);
    const baseParts = base ? base.split("/") : [];
    let prunedDirectory;
    let candidate = "";
    for (const part of baseParts) {
      candidate = candidate ? `${candidate}/${part}` : part;
      if (index.prunedDirectories.has(candidate)) {
        prunedDirectory = candidate;
        break;
      }
    }
    if (base && !knownDirectory && !prunedDirectory)
      throw Object.assign(new Error(`ENOENT: no such directory, scandir '${directory}'`), {
        code: "ENOENT",
      });
    let children = index.childrenByDirectory.get(base || ".") ?? [];
    if (base && children.length === 0 && prunedDirectory) {
      children = await readGeneratedDirectoryRecords(base, readDirectory);
    }
    return children.map((record) => ({
      name: basename(record.path),
      path: record.path,
      isFile: () => record.type === "file",
      isDirectory: () => record.type === "directory",
    }));
  };
}
