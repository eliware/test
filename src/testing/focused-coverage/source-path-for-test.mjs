import { access } from 'node:fs/promises';
import { isAbsolute, relative, resolve, win32 } from 'node:path';

const WINDOWS_ABSOLUTE = /^[A-Za-z]:[\\/]/;

function relativeTestPath(cwd, testPath) {
  const windowsPath = WINDOWS_ABSOLUTE.test(cwd) || WINDOWS_ABSOLUTE.test(testPath);
  if (windowsPath) return win32.relative(win32.resolve(cwd), win32.resolve(testPath));
  return relative(resolve(cwd), resolve(cwd, testPath));
}

/** Resolve one focused test path to its single mirrored source path. */
export async function sourcePathForTest(cwd, testPath, accessPath = access) {
  if (typeof testPath !== 'string') return '';
  const normalized = (isAbsolute(testPath) || WINDOWS_ABSOLUTE.test(testPath) ? relativeTestPath(cwd, testPath) : testPath)
    .replaceAll('\\', '/').replace(/^\.\//, '');
  const marker = normalized.match(/^(.*?)(?:tests?|spec)\/(.*)$/i);
  if (!marker) return '';
  const sourceRelative = marker[2].replace(/\.(?:test|spec)(?=\.[^.]+$)/i, '').replace(/\.[^.]+$/, '');
  const testExtension = marker[2].slice(marker[2].lastIndexOf('.') + 1).toLowerCase();
  const extensions = [testExtension, ...['js', 'mjs', 'cjs', 'ts', 'mts', 'cts', 'jsx', 'tsx'].filter((extension) => extension !== testExtension)];
  const matches = [];
  for (const extension of extensions) for (const candidate of [`src/${sourceRelative}.${extension}`, `src/${sourceRelative}/index.${extension}`]) {
    try { await accessPath(resolve(cwd, candidate)); matches.push(candidate); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  return matches.length === 1 ? matches[0] : '';
}
