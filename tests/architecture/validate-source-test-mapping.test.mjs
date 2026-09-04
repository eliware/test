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
