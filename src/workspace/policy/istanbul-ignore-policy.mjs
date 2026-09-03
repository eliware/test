import { readdir, readFile } from 'node:fs/promises';
import { extname, relative, resolve } from 'node:path';

const SOURCE_EXTENSIONS = new Set(['.cjs', '.cts', '.js', '.jsx', '.mjs', '.mts', '.ts', '.tsx']);
const IGNORED_DIRECTORIES = new Set(['.git', 'node_modules', 'coverage', '.nyc_output', 'test-results', 'dist', 'build']);
const IGNORED_DIRECTIVE = /(?:\/\*\s*\*?\s*|\/\/\s*)istanbul\s+ignore\b/i;

/** Find Istanbul ignore directives outside pure barrel modules. */
export async function findIstanbulIgnoreViolations(cwd, options = {}) {
  const violations = [];
  const readDirectory = options.readDirectory ?? readdir;
  const readSource = options.readSource ?? readFile;
  async function visit(root, directory) {
    for (const entry of await readDirectory(directory, { withFileTypes: true })) {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) {
        if (!IGNORED_DIRECTORIES.has(entry.name)) await visit(root, path);
      } else if (entry.isFile() && SOURCE_EXTENSIONS.has(extname(entry.name).toLowerCase())) {
        const source = await readSource(path, 'utf8');
        const match = source.match(IGNORED_DIRECTIVE);
        if (match && !isPureBarrelSource(source)) violations.push({ file: relative(root, path).replaceAll('\\', '/'), line: source.slice(0, match.index).split(/\r?\n/).length });
      }
    }
  }
  await visit(resolve(cwd), resolve(cwd));
  return violations;
}

/** Return whether source contains only import/export barrel statements. */
export function isPureBarrelSource(source) {
  const withoutComments = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*(?=\r?$)/gm, '$1').trim();
  if (!withoutComments) return false;
  return withoutComments.split(';').map((statement) => statement.trim()).filter(Boolean).every((statement) => /^(?:import\b|export\s+(?:(?:type\s+)?(?:\{|\*)))[\s\S]*$/u.test(statement));
}

/** Check a file for pure-barrel status; missing files are not barrels. */
export async function isPureBarrelFile(path, readSource = readFile) {
  try { return isPureBarrelSource(await readSource(path, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return false; throw error; }
}
