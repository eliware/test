import { discoverPolicySources } from '../../../src/workspace/policy/discover-policy-sources.mjs';

test('discovers supported files while skipping generated directories', async () => {
  const entries = {
    'C:/repo': [{ name: 'src', isDirectory: () => true }, { name: 'coverage', isDirectory: () => true }, { name: 'notes.txt', isDirectory: () => false, isFile: () => false }],
    'C:/repo/src': [{ name: 'module.mjs', isDirectory: () => false, isFile: () => true }, { name: 'generated.mjs', isDirectory: () => false, isFile: () => true }, { name: 'data.json', isDirectory: () => false, isFile: () => true }]
  };
  await expect(discoverPolicySources('C:/repo', async (path) => entries[path.replaceAll('\\', '/')] ?? [])).resolves.toEqual([
    { root: 'C:\\repo', path: 'C:\\repo\\src\\module.mjs' },
    { root: 'C:\\repo', path: 'C:\\repo\\src\\generated.mjs' }
  ]);
});
