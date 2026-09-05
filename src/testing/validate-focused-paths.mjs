import { access, realpath, stat } from 'node:fs/promises';
import { extractFocusedPaths } from '../arguments/focused-paths.mjs';
import { validateOneFocusedPath } from './focused-path/validate-one-focused-path.mjs';

/** Coordinate focused-path extraction and per-path validation. */
export async function validateFocusedPaths(cwd, argumentsList, accessPath, statPath = stat, realpathPath = realpath) {
  if (typeof cwd !== 'string') throw new TypeError('validateFocusedPaths requires cwd');
  if (!Array.isArray(argumentsList)) throw new TypeError('validateFocusedPaths requires an argument array');
  const checkAccess = accessPath ?? access;
  for (const candidate of extractFocusedPaths(argumentsList)) {
    try {
      const missing = await validateOneFocusedPath(cwd, candidate, checkAccess, statPath, realpathPath);
      if (missing) return missing;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      return candidate;
    }
  }
  return '';
}
