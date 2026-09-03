import { access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { extractFocusedPaths } from '../arguments/focused-paths.mjs';

/** Return the first focused test path that does not exist in the workspace. */
export async function validateFocusedPaths(cwd, argumentsList, accessPath) {
  if (typeof cwd !== 'string') throw new TypeError('validateFocusedPaths requires cwd');
  if (!Array.isArray(argumentsList)) throw new TypeError('validateFocusedPaths requires an argument array');
  const checkAccess = accessPath ?? access;
  for (const candidate of extractFocusedPaths(argumentsList)) {
    try { await checkAccess(resolve(cwd, candidate.replaceAll('\\', '/'))); }
    catch (error) { if (error.code !== 'ENOENT') throw error; return candidate; }
  }
  return '';
}
