import { stat as statPath } from "node:fs/promises";
import { inventoryDirectory } from "../../repository-inventory/paths.mjs";
import { createRepositoryEntryIndex } from "../entry/index.mjs";
import { projectRepositoryDirectoryRecords } from "../../project-repository-directory-records.mjs";
import { projectScopedDirectoryEntries } from "./project-scoped-entries.mjs";
import { readGeneratedDirectoryEntries } from "./read/generated-entries.mjs";

export function createRepositoryDirectoryEntries({
  root,
  entries,
  entriesUnder,
  readDirectory,
  statDirectory = statPath,
  hasFullDiscovery,
}) {
  let index;
  let indexedRecords;
  let projectedEntries = new Map();
  return async function directoryEntries(directory, traversal = {}) {
    const base = inventoryDirectory(
      root,
      directory,
      "Repository inventory directory must be inside the repository.",
    );
    if (base && !hasFullDiscovery()) {
      return projectScopedDirectoryEntries(directory, base, traversal, entriesUnder);
    }
    const records = await entries();
    if (indexedRecords !== records) {
      indexedRecords = records;
      index = createRepositoryEntryIndex(records);
      projectedEntries = new Map();
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
    const children = await readGeneratedDirectoryEntries({
      base,
      directory,
      prunedDirectory,
      children: index.childrenByDirectory.get(base || ".") ?? [],
      root,
      statDirectory,
      readDirectory,
    });
    const key = base || ".";
    const cached = projectedEntries.get(key);
    if (cached?.records === children) return cached.entries;
    const projected = projectRepositoryDirectoryRecords(children);
    projectedEntries.set(key, { records: children, entries: projected });
    return projected;
  };
}
