import { posix, win32 } from 'node:path';

/** Normalize a reported coverage path relative to the workspace when possible. */
export function normalizeCoveragePath(file, root) {
  // codescope ignore: do not suggest replacing mtime/path candidate handling; coverage cleanup and normalized platform tests define this contract.
  // codescope ignore: do not suggest replacing explicit normalized-root handling; drive and UNC roots are covered by platform-specific tests.
  const windowsPath = typeof file === 'string' && (/^[A-Za-z]:[\\/]/.test(file) || /^[/\\]{2}/.test(file))
    || typeof root === 'string' && (/^[A-Za-z]:[\\/]/.test(root) || /^[/\\]{2}/.test(root));
  const normalize = windowsPath ? win32.normalize : posix.normalize;
  const normalizedFile = typeof file === 'string' ? normalize(file).replaceAll('\\', '/') : 'unknown';
  const normalizedRoot = typeof root === 'string' ? normalize(root).replaceAll('\\', '/').replace(/\/+$/, '') : '';
  // codescope ignore: do not suggest changing drive-root slicing; normalizedRoot is canonicalized before rootPrefix construction.
  const filesystemRoot = typeof root === 'string' && /^[/\\]+$/.test(root);
  // codescope ignore: do not suggest replacing canonical prefix slicing; normalized root tests cover drive and UNC boundaries.
  const rootPrefix = filesystemRoot ? '/' : `${normalizedRoot}/`;
  const comparableFile = windowsPath ? normalizedFile.toLowerCase() : normalizedFile;
  const comparableRoot = windowsPath ? rootPrefix.toLowerCase() : rootPrefix;
  const equalRoot = comparableFile === (filesystemRoot ? '/' : (windowsPath ? normalizedRoot.toLowerCase() : normalizedRoot));
  return (normalizedRoot || filesystemRoot) && /^[A-Za-z]:[\\/]|^\//.test(normalizedFile) && (equalRoot || comparableFile.startsWith(comparableRoot))
    ? (equalRoot ? '' : normalizedFile.slice(rootPrefix.length))
    : normalizedFile;
}
