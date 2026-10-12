import { stat as statPath } from "node:fs/promises";
import { inventoryPath } from "./repository-inventory-paths.mjs";
import { getRepositoryDirectoryVersion } from "./get-repository-directory-version.mjs";

export function createRepositoryDirectoryReadCache(
  root,
  readDirectory,
  stat = statPath,
  platform = process.platform,
) {
  const reads = new Map();
  let revision = 0;
  function readDirectoryCached(directoryPath, forceRefresh = false) {
    const key = inventoryPath(root, directoryPath);
    const previous = reads.get(key);
    if (previous?.pending) {
      if (!forceRefresh) return previous.promise;
      return previous.promise.then(
        () => readDirectoryCached(key, true),
        () => readDirectoryCached(key, true),
      );
    }

    const current = { pending: true };
    current.promise = Promise.resolve()
      .then(async () => {
        let currentVersion = getRepositoryDirectoryVersion(
          await stat(key, { bigint: true }),
          platform,
        );
        if (
          !forceRefresh &&
          currentVersion.cacheable &&
          previous?.version?.cacheable &&
          previous.version.key === currentVersion.key
        ) {
          current.version = currentVersion;
          current.entries = previous.entries;
          current.pending = false;
          return current.entries;
        }
        current.entries = await readDirectory(key, { withFileTypes: true });
        const afterReadVersion = getRepositoryDirectoryVersion(
          await stat(key, { bigint: true }),
          platform,
        );
        if (afterReadVersion.key !== currentVersion.key) {
          throw new Error(`Directory changed while reading repository entries: ${key}.`);
        }
        if (previous) revision += 1;
        current.version = afterReadVersion;
        current.pending = false;
        return current.entries;
      })
      .catch((error) => {
        if (previous) reads.set(key, previous);
        else reads.delete(key);
        throw error;
      });
    reads.set(key, current);
    return current.promise;
  }
  readDirectoryCached.getRevision = () => revision;
  readDirectoryCached.getTrackedDirectories = () => [...reads.keys()];
  readDirectoryCached.forget = (directoryPath) => {
    if (reads.delete(inventoryPath(root, directoryPath))) revision += 1;
  };
  return readDirectoryCached;
}
