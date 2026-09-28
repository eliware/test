import { normalizeRepositoryInventoryRecords } from "./normalize-repository-inventory-records.mjs";

export function createRepositoryEntryReader({
  root,
  findEntries,
  readDirectoryCached,
  expandedDirectories,
  includeTestResults,
  includeTestResultsUnder,
}) {
  const subtreeEntries = new Map();
  let entriesPromise;
  let freshnessPromise;
  let snapshotRevision;

  function discover() {
    subtreeEntries.clear();
    entriesPromise = Promise.resolve(
      findEntries(root, readDirectoryCached, {
        includeTestResults,
        includeTestResultsUnder,
        expandedDirectories,
      }),
    ).then((records) => {
      snapshotRevision = readDirectoryCached.getRevision();
      return normalizeRepositoryInventoryRecords(root, records);
    });
    return entriesPromise;
  }

  async function refreshIfChanged(snapshot) {
    const records = await snapshot;
    let directoriesExist = true;
    try {
      await Promise.all(
        readDirectoryCached
          .getTrackedDirectories()
          .map((directory) => readDirectoryCached(directory, true)),
      );
    } catch {
      directoriesExist = false;
    }
    if (directoriesExist && readDirectoryCached.getRevision() === snapshotRevision) return records;
    return discover();
  }

  function entries() {
    if (!entriesPromise) return discover();
    if (!freshnessPromise) {
      freshnessPromise = refreshIfChanged(entriesPromise).finally(() => {
        freshnessPromise = undefined;
      });
    }
    return freshnessPromise;
  }

  return { entries, subtreeEntries, hasFullDiscovery: () => Boolean(entriesPromise) };
}
