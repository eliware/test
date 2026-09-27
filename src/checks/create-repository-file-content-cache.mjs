import { inventoryPath } from "./repository-inventory-paths.mjs";

export function createRepositoryFileContentCache(root, read) {
  const fileReads = new Map();
  const textReads = new Map();

  function readBytes(filePath) {
    const key = inventoryPath(root, filePath);
    if (!fileReads.has(key))
      fileReads.set(
        key,
        Promise.resolve()
          .then(() => read(key))
          .then((content) => (Buffer.isBuffer(content) ? content : Buffer.from(content))),
      );
    return fileReads.get(key);
  }

  function readText(filePath) {
    const key = inventoryPath(root, filePath);
    if (!textReads.has(key))
      textReads.set(
        key,
        readBytes(key).then((content) => content.toString("utf8")),
      );
    return textReads.get(key);
  }

  return { readText, readBytes };
}
