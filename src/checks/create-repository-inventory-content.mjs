import { createRepositoryAstCache } from "./create-repository-ast-cache.mjs";
import { inventoryPath } from "./repository-inventory-paths.mjs";

export function createRepositoryContentCache(root, read, parseSource) {
  const fileReads = new Map();
  const textReads = new Map();
  const parsedReads = new Map();

  function readContent(filePath) {
    const key = inventoryPath(root, filePath);
    if (!fileReads.has(key))
      fileReads.set(key, Promise.resolve().then(() => read(key)).then((content) =>
        Buffer.isBuffer(content) ? content : Buffer.from(content),
      ));
    return fileReads.get(key);
  }

  function readText(filePath) {
    const key = inventoryPath(root, filePath);
    if (!textReads.has(key)) textReads.set(key, readContent(key).then((content) => content.toString("utf8")));
    return textReads.get(key);
  }

  function readParsed(filePath, cacheKey, parse) {
    const key = `${inventoryPath(root, filePath)}\0${cacheKey}`;
    if (!parsedReads.has(key)) parsedReads.set(key, readText(filePath).then((text) => parse(text)));
    return parsedReads.get(key);
  }

  return {
    readText,
    readBytes: readContent,
    readParsed,
    parseAst: createRepositoryAstCache({ read: readText, ...(parseSource ? { parseSource } : {}) }),
  };
}
