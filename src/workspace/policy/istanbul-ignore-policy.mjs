import { readFile } from 'node:fs/promises';
import { discoverPolicySources } from './discover-policy-sources.mjs';
import { readPolicySources } from './read-policy-sources.mjs';
import { isPureBarrelSource } from './pure-barrel.mjs';
import { scanIstanbulSource } from './scan-istanbul.mjs';

/** Find Istanbul ignore directives outside pure barrel modules. */
export async function findIstanbulIgnoreViolations(cwd, options = {}) {
  const readSource = options.readSource ?? readFile;
  const sourceFiles = await discoverPolicySources(cwd, options.readDirectory);
  return readPolicySources(sourceFiles, readSource, (root, path, source) => scanIstanbulSource(root, path, source));
}

/** Check a file for pure-barrel status; missing files are not barrels. */
export async function isPureBarrelFile(path, readSource = readFile) {
  try { return isPureBarrelSource(await readSource(path, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return false; throw error; }
}
