import { inventoryPath } from "./repository-inventory-paths.mjs";

export function createRepositoryParsedContentCache(root, readText) {
  const parsedReads = new Map();

  return function readParsed(filePath, cacheKey, parse) {
    const key = `${inventoryPath(root, filePath)}\0${cacheKey}`;
    if (!parsedReads.has(key)) parsedReads.set(key, readText(filePath).then((text) => parse(text)));
    return parsedReads.get(key);
  };
}
