import { findSourceTestMappingDrifts, MAPPING_LIMITS } from '../../src/architecture/validate-source-test-mapping.mjs';
import { resolve } from 'node:path';

test('current source and test trees are bijectively mirrored', async () => {
  await expect(findSourceTestMappingDrifts(process.cwd())).resolves.toEqual({ missingTests: [], orphanTests: [] });
});

test('reports missing and orphan mappings from a virtual tree', async () => {
  const root = resolve('virtual-repo');
  const readDirectory = async (directory) => {
    if (directory === resolve(root, 'src')) return [
      { name: 'present.mjs', isDirectory: () => false, isFile: () => true },
      { name: 'nested', isDirectory: () => true, isFile: () => false },
    ];
    if (directory === resolve(root, 'src/nested')) return [
      { name: 'missing.mjs', isDirectory: () => false, isFile: () => true },
      { name: 'ignored.txt', isDirectory: () => false, isFile: () => true },
      { name: 'special', isDirectory: () => false, isFile: () => false },
    ];
    if (directory === resolve(root, 'tests')) return [
      { name: 'present.test.mjs', isDirectory: () => false, isFile: () => true },
      { name: 'orphan.test.mjs', isDirectory: () => false, isFile: () => true },
    ];
    return [];
  };
  await expect(findSourceTestMappingDrifts(root, readDirectory)).resolves.toEqual({
    missingTests: ['nested/missing'],
    orphanTests: ['orphan'],
  });
});

test('reports mapping drifts in stable lexical order', async () => {
  const root = resolve('ordered-repo');
  const readDirectory = async (directory) => {
    if (directory === resolve(root, 'src')) return [
      { name: 'z.mjs', isDirectory: () => false, isFile: () => true },
      { name: 'a.mjs', isDirectory: () => false, isFile: () => true },
    ];
    if (directory === resolve(root, 'tests')) return [
      { name: 'z.test.mjs', isDirectory: () => false, isFile: () => true },
      { name: 'a-orphan.test.mjs', isDirectory: () => false, isFile: () => true },
    ];
    return [];
  };
  await expect(findSourceTestMappingDrifts(root, readDirectory)).resolves.toEqual({
    missingTests: ['a'], orphanTests: ['a-orphan'],
  });
});

test('requires a mirrored test even for barrel-shaped source files', async () => {
  const root = resolve('barrel-repo');
  const readDirectory = async (directory) => {
    if (directory === resolve(root, 'src')) return [{ name: 'index.mjs', isDirectory: () => false, isFile: () => true }];
    if (directory === resolve(root, 'tests')) return [];
    return [];
  };
  await expect(findSourceTestMappingDrifts(root, readDirectory)).resolves.toEqual({ missingTests: ['index'], orphanTests: [] });
});

test('reports absent mapping roots as drift instead of filesystem errors', async () => {
  const root = resolve('missing-root-repo');
  const readDirectory = async (directory) => {
    if (directory === resolve(root, 'src')) throw Object.assign(new Error('missing'), { code: 'ENOENT' });
    if (directory === resolve(root, 'tests')) throw Object.assign(new Error('missing'), { code: 'ENOENT' });
    return [];
  };
  await expect(findSourceTestMappingDrifts(root, readDirectory)).resolves.toEqual({ missingTests: [], orphanTests: [] });
});

test('skips dependency and generated discovery directories', async () => {
  const entries = new Map([
    ['src', [{ name: 'main.mjs', isDirectory: () => false, isFile: () => true }, { name: 'node_modules', isDirectory: () => true, isFile: () => false }]],
    ['tests', [{ name: 'main.test.mjs', isDirectory: () => false, isFile: () => true }, { name: 'coverage', isDirectory: () => true, isFile: () => false }]],
  ]);
  const readDirectory = async (directory) => entries.get(directory.replaceAll('\\', '/').split('/').slice(-1)[0]) ?? [];
  await expect(findSourceTestMappingDrifts('repo', readDirectory)).resolves.toEqual({ missingTests: [], orphanTests: [] });
});

test('keeps generated files in the strict source/test mapping', async () => {
  const root = resolve('generated-file-repo');
  const entries = new Map([
    ['src', [{ name: 'value.generated.mjs', isDirectory: () => false, isFile: () => true }]],
    ['tests', []]
  ]);
  const readDirectory = async (directory) => entries.get(directory.replaceAll('\\', '/').split('/').slice(-1)[0]) ?? [];
  await expect(findSourceTestMappingDrifts(root, readDirectory)).resolves.toEqual({ missingTests: ['value.generated'], orphanTests: [] });
});

test('propagates mapping read failures other than missing roots', async () => {
  const failure = Object.assign(new Error('denied'), { code: 'EACCES' });
  await expect(findSourceTestMappingDrifts('repo', async () => { throw failure; })).rejects.toBe(failure);
});

test('bounds deeply nested traversal with a stable failure', async () => {
  const root = resolve('deep-repo');
  const readDirectory = async (directory) => {
    const depth = directory.split(/[\\/]/).length - root.split(/[\\/]/).length;
    return [{ name: `level-${depth}`, isDirectory: () => true, isFile: () => false }];
  };
  await expect(findSourceTestMappingDrifts(root, readDirectory)).rejects.toThrow(`depth limit (${MAPPING_LIMITS.maxDepth})`);
});

test('bounds large trees with a stable file-limit failure', async () => {
  const root = resolve('large-repo');
  const readDirectory = async (directory) => {
    if (directory === resolve(root, 'src')) return Array.from({ length: MAPPING_LIMITS.maxFiles + 1 }, (_, index) => ({ name: `file-${index}.mjs`, isDirectory: () => false, isFile: () => true }));
    return [];
  };
  await expect(findSourceTestMappingDrifts(root, readDirectory)).rejects.toThrow(`file limit (${MAPPING_LIMITS.maxFiles})`);
});

test('ignores repeated directory entries', async () => {
  const root = resolve('cycle-repo');
  const readDirectory = async (directory) => {
    if (directory === resolve(root, 'src')) return [{ name: 'loop', isDirectory: () => true, isFile: () => false }];
    if (directory === resolve(root, 'src/loop')) return [{ name: '..', isDirectory: () => true, isFile: () => false }];
    return [];
  };
  await expect(findSourceTestMappingDrifts(root, readDirectory)).resolves.toEqual({ missingTests: [], orphanTests: [] });
});
