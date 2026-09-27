import { basename, dirname } from "node:path";
import { inventoryDirectory } from "./repository-inventory-paths.mjs";

const generatedPath = /(?:^|\/)(?:\.git|node_modules|coverage|dist|build)(?:\/|$)/u;

export function createRepositoryDirectoryEntries({
  root,
  entries,
  readDirectory,
  hasFullDiscovery,
}) {
  let childIndex;
  let knownDirectories;
  let prunedDirectories;
  return async function directoryEntries(directory) {
    const base = inventoryDirectory(
      root,
      directory,
      "Repository inventory directory must be inside the repository.",
    );
    if (base && !hasFullDiscovery()) {
      const children = await readDirectory(base);
      return children.map((entry) => ({
        name: entry.name,
        path: `${base}/${entry.name}`,
        isFile: () => entry.isFile(),
        isDirectory: () => entry.isDirectory(),
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
    for (let length = baseParts.length; length > 0; length -= 1) {
      const candidate = baseParts.slice(0, length).join("/");
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
      children = (await readDirectory(base)).map((entry) => ({
        path: `${base}/${entry.name}`,
        type: entry.isDirectory() ? "directory" : "file",
      }));
    }
    return children.map((record) => ({
      name: basename(record.path),
      path: record.path,
      isFile: () => record.type === "file",
      isDirectory: () => record.type === "directory",
    }));
  };
}
