import { readdir } from 'node:fs/promises';
import { relative, resolve } from 'node:path';

const EXCLUDED_DIRECTORIES = new Set(['.git', 'node_modules', 'coverage', 'dist', 'build', 'test-results']);

async function filesUnder(root, readDirectory) {
  const files = new Set();
  async function visit(directory) {
    let entries;
    try { entries = await readDirectory(directory, { withFileTypes: true }); }
    catch (error) { if (error.code === 'ENOENT') return; throw error; }
    for (const entry of [...entries].sort((left, right) => left.name.localeCompare(right.name))) {
      if (entry.isDirectory() && EXCLUDED_DIRECTORIES.has(entry.name)) continue;
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) await visit(path);
      else if (entry.isFile()) files.add(relative(root, path).replaceAll('\\', '/'));
    }
  }
  await visit(root);
  return files;
}

/** Return source/test mapping differences for a repository. */
export async function findSourceTestMappingDrifts(cwd, readDirectory = readdir) {
  const root = resolve(cwd);
  const source = new Set([...await filesUnder(resolve(root, 'src'), readDirectory)]
    .filter((path) => path.endsWith('.mjs')).map((path) => path.slice(0, -4)));
  const tests = new Set([...await filesUnder(resolve(root, 'tests'), readDirectory)]
    .filter((path) => path.endsWith('.test.mjs')).map((path) => path.slice(0, -9)));
  return {
    missingTests: [...source].filter((path) => !tests.has(path)).sort(),
    orphanTests: [...tests].filter((path) => !source.has(path)).sort(),
  };
}
