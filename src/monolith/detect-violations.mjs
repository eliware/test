import { readdir, readFile } from 'node:fs/promises';
import { relative, resolve, extname } from 'node:path';
import { DEFAULT_THRESHOLDS } from './thresholds.mjs';

const IGNORED_DIRECTORIES = new Set(['node_modules', '.git', 'coverage', 'dist', 'build']);

/** Discover source/test files and return those exceeding their configured limits. */
export async function detectViolations(cwd, options = {}) {
  if (typeof cwd !== 'string' || cwd.length === 0) {
    throw new TypeError('detectViolations requires a working-directory path');
  }
  if (options === null || typeof options !== 'object') {
    throw new TypeError('detectViolations options must be an object');
  }
  const config = await readConfig(cwd, options.readFilePath ?? readFile);
  const files = [];
  await visit(resolve(cwd), resolve(cwd), files, options.readDirectory ?? readdir, options.readSource ?? readFile);
  return files.filter((entry) => !entry.generated && !entry.pureBarrel && !matchesExemption(entry.file, config.exemptions))
    .filter((entry) => entry.lines > config[entry.kind]).map((entry) => ({ ...entry, threshold: config[entry.kind] }));
}

async function visit(root, directory, files, readDirectory, readSource) {
  for (const entry of await readDirectory(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!IGNORED_DIRECTORIES.has(entry.name)) await visit(root, resolve(directory, entry.name), files, readDirectory, readSource);
      continue;
    }
    if (!entry.isFile()) continue;
    const file = relative(root, resolve(directory, entry.name)).replaceAll('\\', '/');
    const kind = classify(file);
    if (!kind) continue;
    const source = await readSource(resolve(directory, entry.name), 'utf8');
    files.push({ file, kind, lines: source.length ? source.replace(/\r\n/g, '\n').replace(/\n$/, '').split('\n').length : 0, generated: /(?:^|\/)(?:generated)(?:\/|$)|\.generated\.|@generated\b/i.test(`${file}\n${source}`), pureBarrel: kind === 'source' && pureBarrel(source) });
  }
}

function classify(file) {
  if (!['.js', '.mjs', '.cjs', '.ts', '.mts', '.cts', '.jsx', '.tsx'].includes(extname(file).toLowerCase())) return '';
  if (/(?:^|\/)(?:tests?|spec)(?:\/|$)/i.test(file)) return 'test';
  if (/(?:^|\/)src(?:\/|$)/i.test(file)) return 'source';
  return '';
}

async function readConfig(cwd, readFilePath) {
  try {
    const configured = JSON.parse(await readFilePath(resolve(cwd, 'package.json'), 'utf8'))?.eliwareTest?.monolithLimits ?? {};
    const config = { source: configured.source ?? DEFAULT_THRESHOLDS.source, test: configured.tests ?? DEFAULT_THRESHOLDS.test, exemptions: configured.exemptions ?? [] };
    if (![config.source, config.test].every((value) => Number.isInteger(value) && value > 0)) throw new Error('monolith limits must be positive integers');
    if (!Array.isArray(config.exemptions) || config.exemptions.some((item) => !item || typeof item.pattern !== 'string' || !item.pattern || typeof item.reason !== 'string' || !item.reason.trim())) throw new Error('each monolith exemption requires a pattern and non-empty reason');
    return config;
  } catch (error) {
    if (error.code === 'ENOENT') return { ...DEFAULT_THRESHOLDS, exemptions: [] };
    throw error;
  }
}

function matchesExemption(file, exemptions) {
  return exemptions.some(({ pattern }) => new RegExp(`^${pattern.split('*').map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*')}$`).test(file));
}

function pureBarrel(source) {
  const content = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*(?=\r?$)/gm, '$1').trim();
  return Boolean(content) && content.split(';').map((statement) => statement.trim()).filter(Boolean).every((statement) => /^(?:import\b|export\s+(?:(?:type\s+)?(?:\{|\*)))[\s\S]*$/u.test(statement));
}
