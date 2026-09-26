import { basename, dirname } from "node:path";
import { findRepositoryEntries } from "./general/E-0.1/find-repository-files.mjs";
import { createDirectoryReadCache, inventoryDirectory } from "./repository-inventory-paths.mjs";

const generatedPath = /(?:^|\/)(?:\.git|node_modules|coverage|dist|build)(?:\/|$)/u;

export function createRepositoryDiscovery({
  root,
  findEntries = findRepositoryEntries,
  readDirectory,
  expandedDirectories = [],
  includeTestResults = false,
  includeTestResultsUnder = [],
}) {
  let entriesPromise;
  const subtreeEntries = new Map();
  const readDirectoryCached = createDirectoryReadCache(root, readDirectory);

  function entries() {
    if (!entriesPromise) {
      entriesPromise = findEntries(root, readDirectoryCached, {
        includeTestResults,
        includeTestResultsUnder,
        expandedDirectories,
      });
    }
    return entriesPromise;
  }

  async function entriesUnder(directory = root) {
    const base = inventoryDirectory(root, directory, "Repository inventory directory must be inside the repository.");
    if (entriesPromise) {
      const records = await entries();
      return base ? records.filter(({ path }) => path === base || path.startsWith(`${base}/`)) : records;
    }
    if (!subtreeEntries.has(base)) {
      const options = { includeTestResults, includeTestResultsUnder, expandedDirectories, scopeDirectory: base };
      const records = findEntries === findRepositoryEntries
        ? findRepositoryEntries(root, readDirectoryCached, options)
        : Promise.resolve(findEntries(root, readDirectoryCached, options)).then((found) =>
            base ? found.filter(({ path }) => path === base || path.startsWith(`${base}/`)) : found,
          );
      subtreeEntries.set(base, records);
    }
    return subtreeEntries.get(base);
  }

  async function directoryEntries(directory) {
    const base = inventoryDirectory(root, directory, "Repository inventory directory must be inside the repository.");
    if (base && !entriesPromise) {
      const children = await readDirectoryCached(base);
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
      children = (await readDirectoryCached(base)).map((entry) => ({
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
  }

  return { entries, entriesUnder, directoryEntries };
}
