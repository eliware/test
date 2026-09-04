import { scanMonolithFiles, DEFAULT_MEASUREMENT_WORKERS, MONOLITH_SCAN_LIMITS } from '../../src/monolith/scan-files.mjs';
import { resolve } from 'node:path';

test('scans eligible files, measures lines, and skips ignored trees', async () => {
  const root = resolve('repo');
  const entries = {
    [root]: [{ name: 'src', isDirectory: () => true }, { name: 'coverage', isDirectory: () => true }],
    [resolve(root, 'src')]: [
      { name: 'module.mjs', isDirectory: () => false, isFile: () => true },
      { name: 'other.mjs', isDirectory: () => false, isFile: () => true },
    ]
  };
  await expect(scanMonolithFiles(root, async (path) => entries[path] ?? [], async () => 'a\nb\n'))
    .resolves.toMatchObject([
      { file: 'src/module.mjs', kind: 'source', lines: 2, generated: false, pureBarrel: false },
      { file: 'src/other.mjs', kind: 'source', lines: 2, generated: false, pureBarrel: false },
    ]);
});

test('does not queue files outside source and test trees for measurement', async () => {
  const root = resolve('repo');
  const reads = [];
  const entries = {
    [root]: [
      { name: 'socket', isDirectory: () => false, isFile: () => false },
      { name: 'README.md', isDirectory: () => false, isFile: () => true },
      { name: 'src', isDirectory: () => true },
    ],
    [resolve(root, 'src')]: [{ name: 'module.mjs', isDirectory: () => false, isFile: () => true }],
  };
  await scanMonolithFiles(root, async (path) => entries[path] ?? [], async (path) => { reads.push(path); return 'x'; });
  expect(reads).toHaveLength(1);
  expect(reads[0]).toMatch(/src[\\/]module\.mjs$/);
});

test('does not traverse unrelated workspace directories', async () => {
  const root = resolve('repo');
  const visited = [];
  const entries = {
    [root]: [
      { name: 'src', isDirectory: () => true },
      { name: 'fixtures', isDirectory: () => true },
    ],
    [resolve(root, 'src')]: [],
  };
  await scanMonolithFiles(root, async (path) => {
    visited.push(path);
    return entries[path] ?? [];
  }, async () => '');
  expect(visited).toEqual([root, resolve(root, 'src')]);
});

test('skips symlinks and bounds depth', async () => {
  const root = resolve('repo');
  let depth = 0;
  const readDirectory = async () => {
    depth += 1;
    if (depth === 1) return [{ name: 'link', isDirectory: () => true, isSymbolicLink: () => true }, { name: 'src', isDirectory: () => true, isSymbolicLink: () => false }];
    return [{ name: 'next', isDirectory: () => true, isSymbolicLink: () => false }];
  };
  await expect(scanMonolithFiles(root, readDirectory)).rejects.toThrow(`depth limit (${MONOLITH_SCAN_LIMITS.maxDepth})`);
});

test('ignores repeated directories', async () => {
  const root = resolve('repo');
  const source = resolve(root, 'src');
  const readDirectory = async (directory) => directory === root
    ? [{ name: 'src', isDirectory: () => true, isSymbolicLink: () => false }]
    : directory === source
      ? [{ name: 'loop', isDirectory: () => true, isSymbolicLink: () => false }]
      : [{ name: '..', isDirectory: () => true, isSymbolicLink: () => false }];
  await expect(scanMonolithFiles(root, readDirectory)).resolves.toEqual([]);
});

test('uses the default worker count and validates overrides', async () => {
  expect(DEFAULT_MEASUREMENT_WORKERS).toBe(6);
  await expect(scanMonolithFiles(resolve('repo'), async () => [], async () => '', 0)).rejects.toThrow('positive integer');
});
