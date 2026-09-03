import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

/** Read and parse workspace package metadata, returning null when absent. */
export async function readPackageJson(cwd, readFilePath = readFile) {
  if (typeof cwd !== 'string' || cwd.length === 0) {
    throw new TypeError('readPackageJson requires a working-directory path');
  }
  if (typeof readFilePath !== 'function') {
    throw new TypeError('readPackageJson requires a file reader');
  }

  try {
    const raw = await readFilePath(resolve(cwd, 'package.json'), 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error?.code === 'ENOENT') return null;
    throw error;
  }
}
