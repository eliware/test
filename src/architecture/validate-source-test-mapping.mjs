import { resolve } from 'node:path';
import { collectMappingFiles } from './collect-mapping-files.mjs';

export const MAPPING_SOURCE_EXTENSION = '.mjs';

/** Return source/test mapping differences for a repository. */
export async function findSourceTestMappingDrifts(cwd, readDirectory) {
  const root = resolve(cwd);
  const [sourceFiles, testFiles] = await Promise.all([collectMappingFiles(resolve(root, 'src'), readDirectory), collectMappingFiles(resolve(root, 'tests'), readDirectory)]);
  const source = new Set([...sourceFiles]
    .filter((path) => path.endsWith(MAPPING_SOURCE_EXTENSION)).map((path) => path.slice(0, -MAPPING_SOURCE_EXTENSION.length)));
  const tests = new Set([...testFiles]
    .filter((path) => path.endsWith('.test.mjs')).map((path) => path.slice(0, -9)));
  return {
    missingTests: [...source].filter((path) => !tests.has(path)).sort(),
    orphanTests: [...tests].filter((path) => !source.has(path)).sort(),
  };
}
