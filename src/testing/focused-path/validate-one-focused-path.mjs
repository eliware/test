import { resolve, posix, win32 } from 'node:path';

const WINDOWS_ABSOLUTE = /^(?:[A-Za-z]:[\\/]|[/\\]{2})/;

function resolveCandidate(cwd, candidate) {
  return WINDOWS_ABSOLUTE.test(cwd) || WINDOWS_ABSOLUTE.test(candidate) ? win32.resolve(cwd, candidate) : resolve(cwd, candidate);
}
function isInsideWorkspace(cwd, path) {
  const pathApi = WINDOWS_ABSOLUTE.test(cwd) || WINDOWS_ABSOLUTE.test(path) ? win32 : posix;
  const relativePath = pathApi.relative(pathApi.resolve(cwd), pathApi.resolve(path));
  return relativePath !== '..' && !relativePath.startsWith('../') && !relativePath.startsWith('..\\') && !relativePath.startsWith('/');
}
function acceptRuntimePathError(error, cwd, fallback) {
  if (error.code === 'ENOENT' || (WINDOWS_ABSOLUTE.test(cwd) && ['UNKNOWN', 'ECONNRESET'].includes(error.code))) return fallback;
  throw error;
}

export async function validateOneFocusedPath(cwd, candidate, accessPath, statPath, realpathPath) {
  const path = resolveCandidate(cwd, candidate.replaceAll('\\', '/'));
  if (!isInsideWorkspace(cwd, path)) return candidate;
  const physicalWorkspace = await realpathPath(cwd).catch((error) => acceptRuntimePathError(error, cwd, resolve(cwd)));
  const physicalPath = await realpathPath(path).catch((error) => acceptRuntimePathError(error, cwd, path));
  if (!isInsideWorkspace(physicalWorkspace, physicalPath)) return candidate;
  await accessPath(path);
  if (!(await statPath(path)).isFile()) return candidate;
  const finalPhysicalPath = await realpathPath(path).catch((error) => acceptRuntimePathError(error, cwd, path));
  if (!isInsideWorkspace(physicalWorkspace, finalPhysicalPath)) return candidate;
  return '';
}
