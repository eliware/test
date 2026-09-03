import { readdir, readFile } from 'node:fs/promises';
import { extname, relative, resolve } from 'node:path';
import { walkWorkspace } from '../discovery/walker.mjs';
const SOURCE_EXTENSIONS = new Set(['.cjs', '.cts', '.js', '.jsx', '.mjs', '.mts', '.ts', '.tsx']);
const IGNORED_DIRECTIVE = /(?:\/\*\s*\*?\s*|\/\/\s*)istanbul\s+ignore\b/i;
export async function findIstanbulIgnoreViolations(cwd, options = {}) {
  const violations = [];
  await walkWorkspace(cwd, async (path) => {
    if (!SOURCE_EXTENSIONS.has(extname(path).toLowerCase())) return;
    const source = await (options.readSource ?? readFile)(path, 'utf8');
    const match = source.match(IGNORED_DIRECTIVE);
    if (match && !isPureBarrelSource(source)) violations.push({ file: relative(resolve(cwd), path).replaceAll('\\', '/'), line: source.slice(0, match.index).split(/\r?\n/).length });
  }, { readDirectory: options.readDirectory ?? readdir });
  return violations;
}
export function isPureBarrelSource(source) {
  const withoutComments = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*(?=\r?$)/gm, '$1').trim();
  if (!withoutComments) return false;
  return withoutComments.split(';').map((statement) => statement.trim()).filter(Boolean).every((statement) => /^(?:import\b|export\s+(?:(?:type\s+)?(?:\{|\*)))[\s\S]*$/u.test(statement));
}
export async function isPureBarrelFile(path, readSource = readFile) {
  try { return isPureBarrelSource(await readSource(path, 'utf8')); } catch (error) { if (error.code === 'ENOENT') return false; throw error; }
}
