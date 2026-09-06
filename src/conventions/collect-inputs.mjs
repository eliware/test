import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { findMissingRequiredPaths } from './required-paths.mjs';
import { readConventionPackage } from './read-package.mjs';
import { collectFileInputs } from './collect-file-inputs.mjs';
import { collectDocumentInputs } from './collect-document-inputs.mjs';

export async function collectConventionInputs({ cwd, accessPath, readFilePath = readFile, readDirectory = readdir, exceptions = [] }) {
  const contentCache = new Map();
  const cachedReadFile = async (path, encoding) => {
    const key = resolve(path);
    if (!contentCache.has(key)) contentCache.set(key, await readFilePath(path, encoding));
    return contentCache.get(key);
  };
  const readText = async (path) => {
    try { return await cachedReadFile(resolve(cwd, path), 'utf8'); } catch { return ''; }
  };
  const packageJson = await readConventionPackage(cwd, cachedReadFile);
  const configuredExceptions = Array.isArray(packageJson?.eliwareTest?.conventions?.exceptions) ? packageJson.eliwareTest.conventions.exceptions.filter((value) => typeof value === 'string') : exceptions;
  const findings = (await findMissingRequiredPaths(cwd, accessPath, configuredExceptions)).map((path) => ({ group: 'structure', message: `missing required path: ${path}` }));
  const read = (path) => readText(path);
  read.readFile = cachedReadFile;
  const directoryCache = new Map();
  const readDirectoryOnce = async (directory, options) => {
    const key = resolve(directory);
    if (!directoryCache.has(key)) directoryCache.set(key, await readDirectory(directory, options));
    return directoryCache.get(key);
  };
  const fileInputs = await collectFileInputs(cwd, readDirectoryOnce);
  const documentInputs = await collectDocumentInputs({ cwd, read, readDirectoryOnce, ...fileInputs });
  return { packageJson, exceptions: configuredExceptions, findings, read, paths: fileInputs.paths, files: fileInputs.files, ...fileInputs, ...documentInputs };
}
