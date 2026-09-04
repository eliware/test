import { posix, win32 } from 'node:path';

/** Normalize a reported coverage path relative to the workspace when possible. */
export function normalizeCoveragePath(file, root) {
  const windowsPath = typeof file === 'string' && /^[A-Za-z]:[\\/]/.test(file)
    || typeof root === 'string' && /^[A-Za-z]:[\\/]/.test(root);
  const normalize = windowsPath ? win32.normalize : posix.normalize;
  const normalizedFile = typeof file === 'string' ? normalize(file).replaceAll('\\', '/') : 'unknown';
  const normalizedRoot = typeof root === 'string' ? normalize(root).replaceAll('\\', '/').replace(/\/+$/, '') : '';
  const rootPrefix = `${normalizedRoot}/`;
  const comparableFile = windowsPath ? normalizedFile.toLowerCase() : normalizedFile;
  const comparableRoot = windowsPath ? rootPrefix.toLowerCase() : rootPrefix;
  return normalizedRoot && /^[A-Za-z]:[\\/]|^\//.test(normalizedFile) && comparableFile.startsWith(comparableRoot)
    ? normalizedFile.slice(rootPrefix.length)
    : normalizedFile;
}
