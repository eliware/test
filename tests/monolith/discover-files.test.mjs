import { discoverMonolithFiles } from '../../src/monolith/discover-files.mjs';

test('discovers a source file and identifies a pure barrel', async () => {
  const files = await discoverMonolithFiles('C:/repo', {
    readDirectory: async (directory) => directory.endsWith('src')
      ? [{ name: 'index.mjs', isDirectory: () => false, isFile: () => true }]
      : [{ name: 'src', isDirectory: () => true }],
    readSource: async () => 'export { value } from "./value.mjs";'
  });
  expect(files[0]).toMatchObject({ kind: 'source', pureBarrel: true });
});
