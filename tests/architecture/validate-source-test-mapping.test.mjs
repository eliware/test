import { findSourceTestMappingDrifts } from '../../src/architecture/validate-source-test-mapping.mjs';
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

test('keeps generated files in the strict source/test mapping', async () => {
  const root = resolve('generated-file-repo');
  const entries = new Map([
    ['src', [{ name: 'value.generated.mjs', isDirectory: () => false, isFile: () => true }]],
    ['tests', []]
  ]);
  const readDirectory = async (directory) => entries.get(directory.replaceAll('\\', '/').split('/').slice(-1)[0]) ?? [];
  await expect(findSourceTestMappingDrifts(root, readDirectory)).resolves.toEqual({ missingTests: ['value.generated'], orphanTests: [] });
});
