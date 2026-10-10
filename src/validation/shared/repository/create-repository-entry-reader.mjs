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
    const pending = Promise.resolve(
      findEntries(root, readDirectoryCached, {
        includeTestResults,
        includeTestResultsUnder,
        expandedDirectories,
      }),
    ).then((records) => {
      snapshotRevision = readDirectoryCached.getRevision();
      return normalizeRepositoryInventoryRecords(root, records);
    });
    const discovery = pending.catch((error) => {
      // codescope ignore: failed discovery clears entriesPromise, so the next entries() call retries.
      entriesPromise = undefined;
      throw error;
    });
    entriesPromise = discovery;
    return discovery;
  }

  async function refreshIfChanged(snapshot) {
    const records = await snapshot;
    let directoriesExist = true;
    // codescope ignore this because serial refresh keeps one stable snapshot without a concurrency requirement.
    for (const directory of readDirectoryCached.getTrackedDirectories()) {
      try {
        await readDirectoryCached(directory);
      } catch (error) {
        if (error?.code !== "ENOENT") throw error;
        readDirectoryCached.forget?.(directory);
        directoriesExist = false;
      }
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
