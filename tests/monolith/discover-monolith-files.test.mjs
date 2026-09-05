import { discoverMonolithFiles } from '../../src/monolith/discover-monolith-files.mjs';
import { resolve } from 'node:path';

test('discovers only relevant source and test files', async () => {
  const root = resolve('repo');
  const entries = {
    [root]: [{ name: 'src', isDirectory: () => true }, { name: 'docs', isDirectory: () => true }],
    [resolve(root, 'src')]: [{ name: 'module.mjs', isDirectory: () => false, isFile: () => true }],
  };
  await expect(discoverMonolithFiles(root, async (path) => entries[path] ?? [])).resolves.toEqual([{ relative: 'src/module.mjs', absolute: resolve(root, 'src/module.mjs') }]);
});
