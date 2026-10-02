import { stat as statPath } from "node:fs/promises";
import { inventoryPath } from "./repository-inventory-paths.mjs";

function version(metadata) {
  // codescope ignore: The five-field snapshot string is constant-size and avoids retaining or comparing mutable stat objects.
  const nanosecondTimestamps =
    typeof metadata.mtimeNs === "bigint" && typeof metadata.ctimeNs === "bigint";
  return {
    cacheable: nanosecondTimestamps,
    key: [
      metadata.dev,
      metadata.ino,
      metadata.size,
      nanosecondTimestamps ? metadata.mtimeNs : metadata.mtimeMs,
      nanosecondTimestamps ? metadata.ctimeNs : metadata.ctimeMs,
    ].join(":"),
  };
}

export function createRepositoryDirectoryReadCache(root, readDirectory, stat = statPath) {
  const reads = new Map();
  let revision = 0;
  function readDirectoryCached(directoryPath, forceRefresh = false) {
    const key = inventoryPath(root, directoryPath);
    const previous = reads.get(key);
    if (previous?.pending) {
      if (!forceRefresh) return previous.promise;
      return previous.promise.catch(() => undefined).then(() => readDirectoryCached(key, true));
    }

    const current = { pending: true };
    current.promise = Promise.resolve()
      .then(async () => {
        let currentVersion = version(await stat(key, { bigint: true }));
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
        const afterReadVersion = version(await stat(key, { bigint: true }));
        if (afterReadVersion.key !== currentVersion.key) {
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
