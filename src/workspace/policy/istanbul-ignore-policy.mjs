import { readdir, readFile } from 'node:fs/promises';
import { extname, relative, resolve } from 'node:path';
import { isPureBarrelSource } from './pure-barrel.mjs';
export { isPureBarrelSource } from './pure-barrel.mjs';

const SOURCE_EXTENSIONS = new Set(['.cjs', '.cts', '.js', '.jsx', '.mjs', '.mts', '.ts', '.tsx']);
const IGNORED_DIRECTORIES = new Set(['.git', 'node_modules', 'coverage', '.nyc_output', 'test-results', 'dist', 'build']);
const IGNORED_DIRECTIVE = /(?:\/\*\s*\*?\s*|\/\/\s*)istanbul\s+ignore\b/i;
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
      const match = source.match(IGNORED_DIRECTIVE);
      if (match && !isPureBarrelSource(source)) violations[index] = { file: relative(root, path).replaceAll('\\', '/'), line: source.slice(0, match.index).split(/\r?\n/).length };
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
