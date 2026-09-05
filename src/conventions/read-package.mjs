import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export async function readConventionPackage(cwd, readFilePath = readFile) {
  try {
    return JSON.parse(await readFilePath(resolve(cwd, 'package.json'), 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') return null;
    return { __error: error instanceof Error ? error.message : String(error) };
  }
}
