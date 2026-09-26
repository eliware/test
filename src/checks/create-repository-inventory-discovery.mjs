import { findRepositoryEntries } from "./general/E-0.1/find-repository-files.mjs";
import { createDirectoryReadCache, inventoryDirectory } from "./repository-inventory-paths.mjs";

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

  return { entries, entriesUnder, readDirectoryCached, hasFullDiscovery: () => Boolean(entriesPromise) };
}
