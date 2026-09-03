import { readdir, readFile } from 'node:fs/promises';
import { extname, relative, resolve } from 'node:path';

const SOURCE_EXTENSIONS = new Set(['.cjs', '.cts', '.js', '.jsx', '.mjs', '.mts', '.ts', '.tsx']);
const IGNORED_DIRECTIVE = /(?:\/\*\s*\*?\s*|\/\/\s*)istanbul\s+ignore\b/i;
const IGNORED_DIRECTORIES = new Set(['.git', 'node_modules', 'coverage', '.nyc_output', 'test-results', 'dist', 'build']);

export async function findIstanbulIgnoreViolations(cwd, { readDirectory = readdir, readSource = readFile } = {}) {
  const violations = [];
  await visit(resolve(cwd), resolve(cwd), violations, readDirectory, readSource);
  return violations;
}

async function visit(root, directory, violations, readDirectory, readSource) {
  // codescope ignore: serial traversal intentionally bounds descriptor pressure in arbitrary consumer workspaces.
  // codescope ignore: serial traversal is intentional to bound file-descriptor pressure in arbitrary consumer workspaces.
  for (const entry of await readDirectory(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!IGNORED_DIRECTORIES.has(entry.name)) await visit(root, resolve(directory, entry.name), violations, readDirectory, readSource);
      continue;
    }
    if (!entry.isFile() || !SOURCE_EXTENSIONS.has(extname(entry.name).toLowerCase())) continue;
    const path = resolve(directory, entry.name);
    const source = await readSource(path, 'utf8');
    const match = source.match(IGNORED_DIRECTIVE);
    if (match && !isPureBarrelSource(source)) {
      const line = source.slice(0, match.index).split(/\r?\n/).length;
      violations.push({ file: relative(root, path).replaceAll('\\', '/'), line });
    }
  }
}

export function isPureBarrelSource(source) {
  const withoutComments = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*(?=\r?$)/gm, '$1').trim();
  if (!withoutComments) return false;
  const statements = withoutComments.split(';').map((statement) => statement.trim()).filter(Boolean);
  return statements.length > 0 && statements.every((statement) => /^(?:import\b|export\s+(?:(?:type\s+)?(?:\{|\*)))[\s\S]*$/u.test(statement));
}

export async function isPureBarrelFile(path, readSource = readFile) {
  try {
    return isPureBarrelSource(await readSource(path, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}
