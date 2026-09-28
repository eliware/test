import { stat as statPath } from "node:fs/promises";
import { readStableFileContent, repositoryFileVersion } from "./read-stable-file-content.mjs";
import { inventoryPath } from "./repository-inventory-paths.mjs";

export function createRepositoryFileContentCache(root, read, stat = statPath) {
  const fileReads = new Map();

  function readBytes(filePath) {
    const key = inventoryPath(root, filePath);
    const previous = fileReads.get(key);
    if (previous?.pending) return previous.promise;

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
        return current.content;
      })
      .catch((error) => {
        fileReads.delete(key);
        throw error;
      });
    fileReads.set(key, current);
    return current.promise;
  }

  function readText(filePath) {
    return readBytes(filePath).then((content) => content.toString("utf8"));
  }

  return { readText, readBytes };
}
