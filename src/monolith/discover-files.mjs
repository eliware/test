import { readdir, readFile } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { IGNORED_DIRECTORIES } from './constants.mjs';
import { classifyFile, isGeneratedFile } from './classify-file.mjs';

export async function discoverMonolithFiles(cwd, { readDirectory = readdir, readSource = readFile } = {}) {
  const files = [];
  await visit(resolve(cwd), resolve(cwd), files, readDirectory, readSource);
  return files;
}

async function visit(root, directory, files, readDirectory, readSource) {
  for (const entry of await readDirectory(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!IGNORED_DIRECTORIES.has(entry.name)) await visit(root, resolve(directory, entry.name), files, readDirectory, readSource);
      continue;
    }
    if (!entry.isFile()) continue;
    const relativePath = relative(root, resolve(directory, entry.name)).replaceAll('\\', '/');
    const kind = classifyFile(relativePath);
    if (!kind) continue;
    const source = await readSource(resolve(directory, entry.name), 'utf8');
    files.push({ file: relativePath, kind, lines: countLines(source), generated: isGeneratedFile(relativePath, source), pureBarrel: kind === 'source' && isPureBarrel(source) });
  }
}

function countLines(source) {
  return source.length === 0 ? 0 : source.replace(/\r\n/g, '\n').replace(/\n$/, '').split('\n').length;
}

function isPureBarrel(source) {
  const withoutComments = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*(?=\r?$)/gm, '$1').trim();
  if (!withoutComments) return false;
  return withoutComments.split(';').map((statement) => statement.trim()).filter(Boolean)
    .every((statement) => /^(?:import\b|export\s+(?:(?:type\s+)?(?:\{|\*)))[\s\S]*$/u.test(statement));
}
