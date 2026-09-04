import { discoverFiles } from '../../src/workspace/discover-files.mjs';

test('validates the workspace and predicate', async () => {
  await expect(discoverFiles('')).rejects.toThrow(TypeError);
  await expect(discoverFiles('C:/repo', { predicate: null })).rejects.toThrow(TypeError);
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

test('uses the default predicate with an injected traversal reader', async () => {
  await expect(discoverFiles('C:/repo', {
    readDirectory: async () => [{ name: 'module.mjs', isDirectory: () => false, isFile: () => true }]
  })).resolves.toHaveLength(1);
});
