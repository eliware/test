import { stat as statPath } from "node:fs/promises";
import { readStableFileContent, repositoryFileVersion } from "./read-stable-file-content.mjs";
import { inventoryPath } from "./repository-inventory-paths.mjs";

const MAX_CACHED_FILE_BYTES = 8 * 1024 * 1024;

export function createRepositoryFileContentCache(root, read, stat = statPath) {
  const fileReads = new Map();
  let cachedBytes = 0;

  function readBytes(filePath) {
    const key = inventoryPath(root, filePath);
    const previous = fileReads.get(key);
    if (previous?.pending) return previous.promise;
    if (previous) {
      fileReads.delete(key);
      fileReads.set(key, previous);
    }

    const current = { pending: true };
    current.promise = Promise.resolve()
      .then(async () => {
        const currentVersion = repositoryFileVersion(await stat(key, { bigint: true }));
        if (previous?.version === currentVersion) {
          const confirmedVersion = repositoryFileVersion(await stat(key, { bigint: true }));
          if (confirmedVersion === currentVersion) {
            current.version = confirmedVersion;
            current.content = previous.content;
            current.pending = false;
            return current.content;
          }
        }
        const stable = await readStableFileContent(key, read, stat);
        current.content = stable.content;
        current.version = stable.version;
        current.pending = false;
        cachedBytes += stable.content.byteLength - (previous?.content?.byteLength ?? 0);
        evictOldContent();
        return current.content;
      })
      .catch((error) => {
        if (previous?.content) cachedBytes -= previous.content.byteLength;
        fileReads.delete(key);
        throw error;
      });
    fileReads.set(key, current);
    return current.promise;
  }

  function readText(filePath) {
    return readBytes(filePath).then((content) => content.toString("utf8"));
  }

  function evictOldContent() {
    for (const [path, entry] of fileReads) {
      if (cachedBytes <= MAX_CACHED_FILE_BYTES) break;
      if (entry.pending) continue;
      fileReads.delete(path);
      cachedBytes -= entry.content.byteLength;
    }
  }

  return { readText, readBytes };
}
