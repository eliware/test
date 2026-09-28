import { stat as statPath } from "node:fs/promises";
import { inventoryPath } from "./repository-inventory-paths.mjs";

function version(metadata) {
  return [metadata.dev, metadata.ino, metadata.size, metadata.mtimeNs, metadata.ctimeNs].join(":");
}

export function createRepositoryDirectoryReadCache(root, readDirectory, stat = statPath) {
  const reads = new Map();
  let revision = 0;
  function readDirectoryCached(directoryPath, forceRefresh = false) {
    const key = inventoryPath(root, directoryPath);
    const previous = reads.get(key);
    if (previous?.pending) return previous.promise;

    const current = { pending: true };
    current.promise = Promise.resolve()
      .then(async () => {
        let currentVersion = version(await stat(key, { bigint: true }));
        if (!forceRefresh && previous?.version === currentVersion) {
          const confirmedVersion = version(await stat(key, { bigint: true }));
          if (confirmedVersion === currentVersion) {
            current.version = currentVersion;
            current.entries = previous.entries;
            current.pending = false;
            return current.entries;
          }
          currentVersion = confirmedVersion;
        }
        current.entries = await readDirectory(key, { withFileTypes: true });
        const afterReadVersion = version(await stat(key, { bigint: true }));
        if (afterReadVersion !== currentVersion) {
          throw new Error(`Directory changed while reading repository entries: ${key}.`);
        }
        if (previous) revision += 1;
        current.version = afterReadVersion;
        current.pending = false;
        return current.entries;
      })
      .catch((error) => {
        reads.delete(key);
        throw error;
      });
    reads.set(key, current);
    return current.promise;
  }
  readDirectoryCached.getRevision = () => revision;
  readDirectoryCached.getTrackedDirectories = () => [...reads.keys()];
  return readDirectoryCached;
}
