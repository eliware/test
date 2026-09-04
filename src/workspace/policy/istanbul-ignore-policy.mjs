import { readdir, readFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { isPureBarrelSource } from './pure-barrel.mjs';
import { scanIstanbulSource } from './scan-istanbul.mjs';
export { isPureBarrelSource } from './pure-barrel.mjs';

const SOURCE_EXTENSIONS = new Set(['.cjs', '.cts', '.js', '.jsx', '.mjs', '.mts', '.ts', '.tsx']);
const IGNORED_DIRECTORIES = new Set(['.git', 'node_modules', 'coverage', '.nyc_output', 'test-results', 'dist', 'build']);
const MAX_SOURCE_READERS = 6;

/** Find Istanbul ignore directives outside pure barrel modules. */
export async function findIstanbulIgnoreViolations(cwd, options = {}) {
  const readDirectory = options.readDirectory ?? readdir;
  const readSource = options.readSource ?? readFile;
  const sourceFiles = [];
  async function visit(root, directory) {
    for (const entry of await readDirectory(directory, { withFileTypes: true })) {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) {
        if (!IGNORED_DIRECTORIES.has(entry.name)) await visit(root, path);
      } else if (entry.isFile() && SOURCE_EXTENSIONS.has(extname(entry.name).toLowerCase())) {
        sourceFiles.push({ root, path });
      }
    }
  }
  await visit(resolve(cwd), resolve(cwd));
  const violations = Array.from({ length: sourceFiles.length });
  let nextIndex = 0;
  async function readSources() {
    while (nextIndex < sourceFiles.length) {
      const index = nextIndex++;
      const { root, path } = sourceFiles[index];
      const source = await readSource(path, 'utf8');
        const violation = scanIstanbulSource(root, path, source);
        if (violation) violations[index] = violation;
    }
  }
  await Promise.all(Array.from({ length: Math.min(MAX_SOURCE_READERS, sourceFiles.length) }, () => readSources()));
  return violations.filter(Boolean);
}

/** Check a file for pure-barrel status; missing files are not barrels. */
export async function isPureBarrelFile(path, readSource = readFile) {
  try { return isPureBarrelSource(await readSource(path, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return false; throw error; }
}
