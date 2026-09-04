import { access, realpath, stat } from 'node:fs/promises';
import { posix, resolve, win32 } from 'node:path';
import { extractFocusedPaths } from '../arguments/focused-paths.mjs';

const WINDOWS_ABSOLUTE = /^(?:[A-Za-z]:[\\/]|[/\\]{2})/;

function resolveCandidate(cwd, candidate) {
  return WINDOWS_ABSOLUTE.test(cwd) || WINDOWS_ABSOLUTE.test(candidate)
    ? win32.resolve(cwd, candidate)
    : resolve(cwd, candidate);
}

function isInsideWorkspace(cwd, path) {
  const pathApi = WINDOWS_ABSOLUTE.test(cwd) || WINDOWS_ABSOLUTE.test(path) ? win32 : posix;
  const relativePath = pathApi.relative(pathApi.resolve(cwd), pathApi.resolve(path));
  return relativePath !== '..' && !relativePath.startsWith('../') && !relativePath.startsWith('..\\') && !relativePath.startsWith('/');
}

/** Return the first focused test path that does not exist in the workspace. */
export async function validateFocusedPaths(cwd, argumentsList, accessPath, statPath = stat, realpathPath = realpath) {
  if (typeof cwd !== 'string') throw new TypeError('validateFocusedPaths requires cwd');
  if (!Array.isArray(argumentsList)) throw new TypeError('validateFocusedPaths requires an argument array');
  const checkAccess = accessPath ?? access;
  for (const candidate of extractFocusedPaths(argumentsList)) {
    try {
      const path = resolveCandidate(cwd, candidate.replaceAll('\\', '/'));
      if (!isInsideWorkspace(cwd, path)) return candidate;
      const physicalWorkspace = await realpathPath(cwd).catch((error) => {
        if (error.code === 'ENOENT' || (WINDOWS_ABSOLUTE.test(cwd) && ['UNKNOWN', 'ECONNRESET'].includes(error.code))) return resolve(cwd);
        throw error;
      });
      const physicalPath = await realpathPath(path).catch((error) => {
        if (error.code === 'ENOENT' || (WINDOWS_ABSOLUTE.test(cwd) && ['UNKNOWN', 'ECONNRESET'].includes(error.code))) return path;
        throw error;
      });
      if (!isInsideWorkspace(physicalWorkspace, physicalPath)) return candidate;
      await checkAccess(path);
      if (!(await statPath(path)).isFile()) return candidate;
    }
    catch (error) { if (error.code !== 'ENOENT') throw error; return candidate; }
  }
  return '';
}
