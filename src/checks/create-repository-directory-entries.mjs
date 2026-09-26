import { basename, dirname } from "node:path";
import { inventoryDirectory } from "./repository-inventory-paths.mjs";

const generatedPath = /(?:^|\/)(?:\.git|node_modules|coverage|dist|build)(?:\/|$)/u;

export function createRepositoryDirectoryEntries({ root, entries, readDirectory, hasFullDiscovery }) {
  return async function directoryEntries(directory) {
    const base = inventoryDirectory(root, directory, "Repository inventory directory must be inside the repository.");
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
    const knownDirectory = records.some(({ path, type }) => path === base && type === "directory");
    const prunedDirectory = records.find(({ path, type }) =>
      type === "directory" && generatedPath.test(path) && (base === path || base.startsWith(`${path}/`)),
    );
    if (base && !knownDirectory && !prunedDirectory)
      throw Object.assign(new Error(`ENOENT: no such directory, scandir '${directory}'`), { code: "ENOENT" });
    let children = records.filter(({ path }) => dirname(path).replaceAll("\\", "/") === (base || "."));
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
