import { basename, dirname } from "node:path";
import { inventoryDirectory } from "./repository-inventory-paths.mjs";

const generatedPath = /(?:^|\/)(?:\.git|node_modules|coverage|dist|build)(?:\/|$)/u;

export function createRepositoryDirectoryEntries({
  root,
  entries,
  entriesUnder,
  readDirectory,
  hasFullDiscovery,
}) {
  let childIndex;
  let knownDirectories;
  let prunedDirectories;
  const fallbackChildren = new Map();
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
    if (!childIndex) {
      childIndex = new Map();
      knownDirectories = new Set();
      prunedDirectories = new Set();
      for (const record of records) {
        const parent = dirname(record.path).replaceAll("\\", "/");
        const siblings = childIndex.get(parent) ?? [];
        siblings.push(record);
        childIndex.set(parent, siblings);
        if (record.type === "directory") {
          knownDirectories.add(record.path);
          if (generatedPath.test(record.path)) prunedDirectories.add(record.path);
        }
      }
    }
    const knownDirectory = knownDirectories.has(base);
    const baseParts = base ? base.split("/") : [];
    let prunedDirectory;
    let candidate = "";
    for (const part of baseParts) {
      candidate = candidate ? `${candidate}/${part}` : part;
      if (prunedDirectories.has(candidate)) {
        prunedDirectory = candidate;
        break;
      }
    }
    if (base && !knownDirectory && !prunedDirectory)
      throw Object.assign(new Error(`ENOENT: no such directory, scandir '${directory}'`), {
        code: "ENOENT",
      });
    let children = childIndex.get(base || ".") ?? [];
    if (base && children.length === 0 && prunedDirectory) {
      if (!fallbackChildren.has(base)) {
        fallbackChildren.set(
          base,
          Promise.resolve(readDirectory(base)).then((entries) =>
            entries.map((entry) => ({
              path: `${base}/${entry.name}`,
              type: entry.isDirectory() ? "directory" : "file",
            })),
          ),
        );
      }
      children = await fallbackChildren.get(base);
    }
    return children.map((record) => ({
      name: basename(record.path),
      path: record.path,
      isFile: () => record.type === "file",
      isDirectory: () => record.type === "directory",
    }));
  };
}
