import { access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { isTestPath, positionalArguments } from './arguments.mjs';
import { sourcePathForTest } from './mapping.mjs';
export { isTestPath } from './arguments.mjs';
export async function focusedCoverageArguments(cwd, testPaths, accessPath = access) {
  const sourcePaths = await Promise.all([...new Set(testPaths)].map((path) => sourcePathForTest(cwd, path, accessPath)));
  if (sourcePaths.some((path) => !path)) return [];
  return [...new Set(sourcePaths)].flatMap((path) => ['--collectCoverageFrom', path]);
}
export async function findMissingFocusedPath(cwd, argumentsList, accessPath = access) {
  for (const candidate of positionalArguments(argumentsList).filter(isTestPath)) {
    try { await accessPath(resolve(cwd, candidate.replaceAll('\\', '/'))); }
    catch (error) { if (error.code !== 'ENOENT') throw error; return candidate; }
  }
  return '';
}
