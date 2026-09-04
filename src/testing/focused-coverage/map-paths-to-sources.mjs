import { access } from 'node:fs/promises';
import { sourcePathForTest } from './source-path-for-test.mjs';

/** Map focused test files to unambiguous mirrored source files. */
export async function mapPathsToSources(cwd, testPaths, accessPath) {
  if (!Array.isArray(testPaths)) throw new TypeError('mapPathsToSources requires test paths');
  const checkAccess = accessPath ?? access;
  const mapped = await Promise.all([...new Set(testPaths)].map((path) => sourcePathForTest(cwd, path, checkAccess)));
  return mapped.every(Boolean) ? [...new Set(mapped)] : [];
}
