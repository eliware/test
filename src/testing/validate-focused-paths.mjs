import { access, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { extractFocusedPaths } from '../arguments/focused-paths.mjs';

/** Return the first focused test path that does not exist in the workspace. */
export async function validateFocusedPaths(cwd, argumentsList, accessPath, statPath = stat) {
  if (typeof cwd !== 'string') throw new TypeError('validateFocusedPaths requires cwd');
  if (!Array.isArray(argumentsList)) throw new TypeError('validateFocusedPaths requires an argument array');
  const checkAccess = accessPath ?? access;
  for (const candidate of extractFocusedPaths(argumentsList)) {
    try {
      const path = resolve(cwd, candidate.replaceAll('\\', '/'));
      await checkAccess(path);
      if (!(await statPath(path)).isFile()) return candidate;
    }
    catch (error) { if (error.code !== 'ENOENT') throw error; return candidate; }
  }
  return '';
}
