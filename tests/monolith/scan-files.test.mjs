import { scanMonolithFiles } from '../../src/monolith/scan-files.mjs';

test('scans eligible files, measures lines, and skips ignored trees', async () => {
  const entries = {
    'C:/repo': [{ name: 'src', isDirectory: () => true }, { name: 'coverage', isDirectory: () => true }],
    'C:/repo/src': [{ name: 'module.mjs', isDirectory: () => false, isFile: () => true }]
  };
  await expect(scanMonolithFiles('C:/repo', async (path) => entries[path.replaceAll('\\', '/')] ?? [], async () => 'a\nb\n'))
    .resolves.toMatchObject([{ file: 'src/module.mjs', kind: 'source', lines: 2, generated: false, pureBarrel: false }]);
});
