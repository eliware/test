import { discoverFiles } from '../../src/workspace/discover-files.mjs';

test('discovers files while excluding standard directories', async () => {
  const files = await discoverFiles('C:/repo', {
    readDirectory: async (path) => path.endsWith('repo')
      ? [{ name: 'coverage', isDirectory: () => true }, { name: 'src', isDirectory: () => true }]
      : [{ name: 'a.mjs', isDirectory: () => false, isFile: () => true }]
  });
  expect(files).toHaveLength(1);
  expect(files[0]).toMatch(/a\.mjs$/);
});
