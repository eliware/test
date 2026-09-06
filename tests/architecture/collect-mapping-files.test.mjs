import { collectMappingFiles, MAPPING_LIMITS } from '../../src/architecture/collect-mapping-files.mjs';
import { resolve } from 'node:path';

test('collects files recursively in stable order-independent form', async () => {
  const root = resolve('mapping-repo');
  const readDirectory = async (directory) => directory === root
    ? [{ name: 'nested', isDirectory: () => true, isFile: () => false }]
    : [{ name: 'value.mjs', isDirectory: () => false, isFile: () => true }];
  await expect(collectMappingFiles(root, readDirectory)).resolves.toEqual(new Set(['nested/value.mjs']));
});

test('skips dependency, generated, and symbolic-link entries', async () => {
  const root = resolve('filtered-mapping-repo');
  const readDirectory = async () => [
    { name: 'node_modules', isDirectory: () => true, isFile: () => false },
    { name: 'coverage', isDirectory: () => true, isFile: () => false },
    { name: 'link', isSymbolicLink: () => true, isDirectory: () => true, isFile: () => false },
    { name: 'source.mjs', isDirectory: () => false, isFile: () => true },
  ];
  await expect(collectMappingFiles(root, readDirectory)).resolves.toEqual(new Set(['source.mjs']));
});

test('treats a missing root as an empty set and propagates other read failures', async () => {
  const missing = Object.assign(new Error('missing'), { code: 'ENOENT' });
  await expect(collectMappingFiles('missing-mapping-repo', async () => { throw missing; })).resolves.toEqual(new Set());
  const denied = Object.assign(new Error('denied'), { code: 'EACCES' });
  await expect(collectMappingFiles('denied-mapping-repo', async () => { throw denied; })).rejects.toBe(denied);
});

test('bounds traversal depth and file count', async () => {
  const root = resolve('bounded-mapping-repo');
  const deepReader = async (directory) => {
    const depth = directory.split(/[\\/]/).length - root.split(/[\\/]/).length;
    return [{ name: `level-${depth}`, isDirectory: () => true, isFile: () => false }];
  };
  await expect(collectMappingFiles(root, deepReader)).rejects.toThrow(`depth limit (${MAPPING_LIMITS.maxDepth})`);
  const largeReader = async () => Array.from({ length: MAPPING_LIMITS.maxFiles + 1 }, (_, index) => ({ name: `file-${index}.mjs`, isDirectory: () => false, isFile: () => true }));
  await expect(collectMappingFiles(root, largeReader)).rejects.toThrow(`file limit (${MAPPING_LIMITS.maxFiles})`);
});

test('does not revisit repeated directories', async () => {
  const root = resolve('cycle-mapping-repo');
  const readDirectory = async (directory) => directory === root
    ? [{ name: 'loop', isDirectory: () => true, isFile: () => false }, { name: 'loop', isDirectory: () => true, isFile: () => false }]
    : [{ name: '..', isDirectory: () => true, isFile: () => false }];
  await expect(collectMappingFiles(root, readDirectory)).resolves.toEqual(new Set());
});
