import { access } from 'node:fs/promises';
import { isAbsolute, relative, resolve } from 'node:path';

/** Resolve one focused test path to its single mirrored source path. */
export async function sourcePathForTest(cwd, testPath, accessPath = access) {
  if (typeof testPath !== 'string') return '';
  const normalized = (isAbsolute(testPath) ? relative(cwd, testPath) : testPath)
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
