import { walkFiles } from '../../src/workspace/walk-files.mjs';

test('walks files and excludes standard directories', async () => {
  const seen = [];
  await walkFiles('C:/repo', async (path) => seen.push(path), {
    readDirectory: async (path) => path.endsWith('repo')
      ? [{ name: 'coverage', isDirectory: () => true }, { name: 'src', isDirectory: () => true }]
      : path.endsWith('src')
        ? [{ name: 'a.mjs', isDirectory: () => false, isFile: () => true }]
        : []
  });
  expect(seen).toHaveLength(1);
  expect(seen[0]).toMatch(/a\.mjs$/);
});
