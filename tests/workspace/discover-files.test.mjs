import { discoverFiles } from '../../src/workspace/discover-files.mjs';

test('validates the workspace and predicate', async () => {
  await expect(discoverFiles('')).rejects.toThrow(TypeError);
  await expect(discoverFiles('C:/repo', { predicate: null })).rejects.toThrow(TypeError);
});

test('discovers files while excluding standard directories', async () => {
  const files = await discoverFiles('C:/repo', {
    readDirectory: async (path) => path.endsWith('repo')
      ? [{ name: 'coverage', isDirectory: () => true }, { name: 'src', isDirectory: () => true }]
      : [{ name: 'a.mjs', isDirectory: () => false, isFile: () => true }]
  });
  expect(files).toHaveLength(1);
  expect(files[0]).toMatch(/a\.mjs$/);
});

test('applies the predicate and skips unknown entries', async () => {
  const files = await discoverFiles('C:/repo', {
    predicate: (path) => path.endsWith('keep.mjs'),
    readDirectory: async () => [
      { name: 'keep.mjs', isDirectory: () => false, isFile: () => true },
      { name: 'drop.mjs', isDirectory: () => false, isFile: () => true },
      { name: 'unknown', isDirectory: () => false, isFile: () => false }
    ]
  });
  expect(files).toHaveLength(1);
  expect(files[0]).toMatch(/keep\.mjs$/);
});

test('uses the default predicate and directory reader', async () => {
  const files = await discoverFiles('test-fixtures/exclusions');
  expect(files.some((path) => path.endsWith('valid.mjs'))).toBe(true);
});
