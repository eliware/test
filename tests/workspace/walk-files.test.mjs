import { walkFiles } from '../../src/workspace/walk-files.mjs';
import { WALK_LIMITS } from '../../src/workspace/walk-policy.mjs';

test('validates the workspace, visitor, and options', async () => {
  await expect(walkFiles('')).rejects.toThrow(TypeError);
  await expect(walkFiles('C:/repo', null)).rejects.toThrow(TypeError);
  await expect(walkFiles('C:/repo', () => {}, null)).rejects.toThrow(TypeError);
});

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

test('skips directory entries that are neither files nor directories', async () => {
  const seen = [];
  await walkFiles('C:/repo', async (path) => seen.push(path), {
    readDirectory: async () => [{ name: 'unknown', isDirectory: () => false, isFile: () => false }]
  });
  expect(seen).toEqual([]);
});

test('uses the default directory reader', async () => {
  const seen = [];
  await walkFiles('test-fixtures/exclusions', async (path) => seen.push(path));
  expect(seen.some((path) => path.endsWith('valid.mjs'))).toBe(true);
});

test('skips symlinks and bounds traversal', async () => {
  await expect(walkFiles('C:/repo', () => {}, { readDirectory: async (path) => path.endsWith('repo')
    ? [{ name: 'link', isDirectory: () => true, isSymbolicLink: () => true }]
    : [{ name: 'next', isDirectory: () => true }] })).resolves.toBeUndefined();
  await expect(walkFiles('C:/repo', () => {}, { readDirectory: async () => [{ name: 'next', isDirectory: () => true }] })).rejects.toThrow(`depth limit (${WALK_LIMITS.maxDepth})`);
});

test('ignores repeated directories and bounds files', async () => {
  await expect(walkFiles('C:/repo', () => {}, { readDirectory: async (path) => path.endsWith('repo')
    ? [{ name: 'loop', isDirectory: () => true }]
    : [{ name: '..', isDirectory: () => true }] })).resolves.toBeUndefined();
  await expect(walkFiles('C:/repo', () => {}, { readDirectory: async (path) => path.endsWith('repo')
    ? Array.from({ length: WALK_LIMITS.maxFiles + 1 }, (_, index) => ({ name: `f${index}`, isDirectory: () => false, isFile: () => true }))
    : [] })).rejects.toThrow(`file limit (${WALK_LIMITS.maxFiles})`);
});
