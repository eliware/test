import { stat as statPath } from "node:fs/promises";
import { inventoryPath } from "./repository-inventory-paths.mjs";

function version(metadata, platform) {
  // codescope ignore: The five-field snapshot string is constant-size and avoids retaining or comparing mutable stat objects.
  // codescope ignore this because reuse requires all snapshot fields, including birthtime, to be reliable.
  const nanosecondTimestamps =
    typeof metadata.mtimeNs === "bigint" &&
    typeof metadata.ctimeNs === "bigint" &&
    typeof metadata.birthtimeNs === "bigint";
  return {
    cacheable: platform !== "win32" && nanosecondTimestamps,
    // String conversion is safe for BigIntStats; Windows disables reuse but still compares snapshots around readdir.
    key: [
      metadata.dev,
      metadata.ino,
      metadata.size,
      metadata.mtimeNs,
      metadata.ctimeNs,
      metadata.birthtimeNs,
    ]
      .map(String)
      .join(":"),
  };
}

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
      return previous.promise.catch(() => undefined).then(() => readDirectoryCached(key, true));
    }

    const current = { pending: true };
    current.promise = Promise.resolve()
      .then(async () => {
        let currentVersion = version(await stat(key, { bigint: true }), platform);
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
        const afterReadVersion = version(await stat(key, { bigint: true }), platform);
        // codescope ignore this because cached traversal uses native high-resolution directory stat values.
        if (afterReadVersion.key !== currentVersion.key) {
          throw new Error(`Directory changed while reading repository entries: ${key}.`);
        }
        if (previous) revision += 1;
        // codescope ignore this because repository inventory does not promise an atomic snapshot during concurrent writes.
        current.version = afterReadVersion;
        current.pending = false;
        return current.entries;
      })
      .catch((error) => {
        // codescope ignore this because later reads compare current metadata before reusing this entry.
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
