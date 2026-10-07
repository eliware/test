import { findRepositoryEntries } from "./find-repository-files.mjs";
import { inventoryDirectory } from "./repository-inventory-paths.mjs";
import { normalizeRepositoryInventoryRecords } from "./normalize-repository-inventory-records.mjs";

export function createRepositoryScopedEntryReader({
  root,
  findEntries,
  readDirectoryCached,
  entryReader,
  includeTestResults,
  includeTestResultsUnder,
  expandedDirectories,
}) {
  const { entries, subtreeEntries, hasFullDiscovery } = entryReader;

  return async function entriesUnder(directory = root, fileFilter = null, traversal = {}) {
    const base = inventoryDirectory(
      root,
      directory,
      "Repository inventory directory must be inside the repository.",
    );
    if (!base) {
      const records = await entries();
      return fileFilter
        ? records.filter((record) => record.type !== "file" || fileFilter(record.path))
        : records;
    }
    if (hasFullDiscovery()) {
      const records = await entries();
      return filterSubtree(records, base, fileFilter);
    }
    if (fileFilter) {
      const options = {
        includeTestResults,
        includeTestResultsUnder,
        expandedDirectories,
        scopeDirectory: base,
        fileFilter,
        ...traversal,
      };
      const records = normalizeRepositoryInventoryRecords(
        root,
        await findEntries(root, readDirectoryCached, options),
      );
      if (!hasFullDiscovery()) return filterSubtree(records, base, fileFilter);
      return filterSubtree(await entries(), base, fileFilter);
    }
    if (!subtreeEntries.has(base)) {
      const options = {
        includeTestResults,
        includeTestResultsUnder,
        expandedDirectories,
        scopeDirectory: base,
        ...traversal,
      };
      const records =
        findEntries === findRepositoryEntries
          ? findRepositoryEntries(root, readDirectoryCached, options)
          : Promise.resolve(findEntries(root, readDirectoryCached, options)).then((found) =>
              normalizeRepositoryInventoryRecords(root, found).filter(
                ({ path }) => path === base || path.startsWith(`${base}/`),
              ),
            );
      subtreeEntries.set(base, records);
    }
    const records = await subtreeEntries.get(base);
    if (!hasFullDiscovery()) return records;
    const fullRecords = await entries();
    return fullRecords.filter(({ path }) => path === base || path.startsWith(`${base}/`));
  };

  function filterSubtree(records, base, fileFilter) {
    return records.filter(
      ({ path, type }) =>
        (path === base || path.startsWith(`${base}/`)) &&
        (type !== "file" || !fileFilter || fileFilter(path)),
    );
  }
}
