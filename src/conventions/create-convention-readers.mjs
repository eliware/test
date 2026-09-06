import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

/** Create cached repository text and directory readers for convention stages. */
export function createConventionReaders(cwd, readFilePath = readFile, readDirectory = readdir) {
  const contentCache = new Map();
  const cachedReadFile = async (path, encoding) => {
    const key = resolve(path);
    if (!contentCache.has(key)) contentCache.set(key, await readFilePath(path, encoding));
    return contentCache.get(key);
  };
  const read = async (path) => {
    try { return await cachedReadFile(resolve(cwd, path), 'utf8'); } catch { return ''; }
  };
  read.readFile = cachedReadFile;
  const directoryCache = new Map();
  const readDirectoryOnce = async (directory, options) => {
    const key = resolve(directory);
    if (!directoryCache.has(key)) directoryCache.set(key, await readDirectory(directory, options));
    return directoryCache.get(key);
  };
  return { cachedReadFile, read, readDirectoryOnce };
}
