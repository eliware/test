import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

/** Read a non-empty npm script from package.json, or return an empty string. */
export async function configuredScript(cwd, name, readFilePath = readFile) {
  if (typeof cwd !== 'string' || typeof name !== 'string') throw new TypeError('configuredScript requires cwd and script name');
  let raw;
  try { raw = await readFilePath(resolve(cwd, 'package.json'), 'utf8'); }
  catch (error) { if (error.code === 'ENOENT') return ''; throw error; }
  const packageJson = JSON.parse(raw);
  const script = packageJson?.scripts?.[name];
  return typeof script === 'string' && script.trim() ? script : '';
}
