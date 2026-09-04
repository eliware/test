import { scanMonolithFiles, DEFAULT_MEASUREMENT_WORKERS, MONOLITH_SCAN_LIMITS } from '../../src/monolith/scan-files.mjs';

test('scans eligible files, measures lines, and skips ignored trees', async () => {
  const entries = {
    'C:/repo': [{ name: 'src', isDirectory: () => true }, { name: 'coverage', isDirectory: () => true }],
    'C:/repo/src': [
      { name: 'module.mjs', isDirectory: () => false, isFile: () => true },
      { name: 'other.mjs', isDirectory: () => false, isFile: () => true },
    ]
  };
  await expect(scanMonolithFiles('C:/repo', async (path) => entries[path.replaceAll('\\', '/')] ?? [], async () => 'a\nb\n'))
    .resolves.toMatchObject([
      { file: 'src/module.mjs', kind: 'source', lines: 2, generated: false, pureBarrel: false },
      { file: 'src/other.mjs', kind: 'source', lines: 2, generated: false, pureBarrel: false },
    ]);
});

test('does not queue files outside source and test trees for measurement', async () => {
  const reads = [];
  const entries = {
    'C:/repo': [
      { name: 'socket', isDirectory: () => false, isFile: () => false },
      { name: 'README.md', isDirectory: () => false, isFile: () => true },
      { name: 'src', isDirectory: () => true },
    ],
    'C:/repo/src': [{ name: 'module.mjs', isDirectory: () => false, isFile: () => true }],
  };
  await scanMonolithFiles('C:/repo', async (path) => entries[path.replaceAll('\\', '/')] ?? [], async (path) => { reads.push(path); return 'x'; });
  expect(reads).toHaveLength(1);
  expect(reads[0]).toMatch(/src[\\/]module\.mjs$/);
});

test('skips symlinks and bounds depth', async () => {
  const root = '/repo';
  let depth = 0;
  const readDirectory = async () => {
    depth += 1;
    if (depth === 1) return [{ name: 'link', isDirectory: () => true, isSymbolicLink: () => true }, { name: 'next', isDirectory: () => true, isSymbolicLink: () => false }];
    return [{ name: 'next', isDirectory: () => true, isSymbolicLink: () => false }];
  };
  await expect(scanMonolithFiles(root, readDirectory)).rejects.toThrow(`depth limit (${MONOLITH_SCAN_LIMITS.maxDepth})`);
});

test('ignores repeated directories', async () => {
  const root = '/repo';
  const readDirectory = async (directory) => directory === root
    ? [{ name: 'loop', isDirectory: () => true, isSymbolicLink: () => false }]
    : [{ name: '..', isDirectory: () => true, isSymbolicLink: () => false }];
  await expect(scanMonolithFiles(root, readDirectory)).resolves.toEqual([]);
});

test('uses the default worker count and validates overrides', async () => {
  expect(DEFAULT_MEASUREMENT_WORKERS).toBe(6);
  await expect(scanMonolithFiles('/repo', async () => [], async () => '', 0)).rejects.toThrow('positive integer');
});
