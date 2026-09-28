import { inventoryPath } from "./repository-inventory-paths.mjs";

export function createRepositoryParsedContentCache(root, readText) {
  const parsedReads = new Map();

  return async function readParsed(filePath, cacheKey, parse) {
    const key = `${inventoryPath(root, filePath)}\0${cacheKey}`;
    const text = await readText(filePath);
    const cached = parsedReads.get(key);
    if (cached?.text === text) return cached.promise;

    const entry = { text, promise: Promise.resolve().then(() => parse(text)) };
    parsedReads.set(key, entry);
    entry.promise.catch(() => {
      if (parsedReads.get(key) === entry) parsedReads.delete(key);
    });
    return entry.promise;
  };
}
