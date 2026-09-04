import { discoverPolicySources } from '../../../src/workspace/policy/discover-policy-sources.mjs';
import { POLICY_DISCOVERY_LIMITS } from '../../../src/workspace/policy/discover-policy-sources.mjs';

test('discovers supported files while skipping generated directories', async () => {
  const entries = {
    'C:/repo': [{ name: 'src', isDirectory: () => true }, { name: 'coverage', isDirectory: () => true }, { name: 'notes.txt', isDirectory: () => false, isFile: () => false }],
    'C:/repo/src': [{ name: 'module.mjs', isDirectory: () => false, isFile: () => true }, { name: 'generated.mjs', isDirectory: () => false, isFile: () => true }, { name: 'data.json', isDirectory: () => false, isFile: () => true }]
  };
  await expect(discoverPolicySources('C:/repo', async (path) => entries[path.replaceAll('\\', '/')] ?? [])).resolves.toEqual([
    { root: 'C:\\repo', path: 'C:\\repo\\src\\generated.mjs' }
    ,{ root: 'C:\\repo', path: 'C:\\repo\\src\\module.mjs' }
  ]);
});

test('skips symlinks and bounds recursive discovery', async () => {
  const root = 'C:/repo';
  const readDirectory = async (path) => {
    if (path.endsWith('repo')) return [{ name: 'link', isDirectory: () => true, isSymbolicLink: () => true }];
    return [{ name: 'next', isDirectory: () => true, isSymbolicLink: () => false }];
  };
  await expect(discoverPolicySources(root, readDirectory)).resolves.toEqual([]);
  await expect(discoverPolicySources(root, async () => [{ name: 'next', isDirectory: () => true }])).rejects.toThrow(`depth limit (${POLICY_DISCOVERY_LIMITS.maxDepth})`);
});

test('ignores repeated directories and bounds file discovery', async () => {
  const root = 'C:/repo';
  await expect(discoverPolicySources(root, async (path) => {
    if (path.endsWith('repo')) return [{ name: 'loop', isDirectory: () => true }];
    return [{ name: '..', isDirectory: () => true }];
  })).resolves.toEqual([]);
  await expect(discoverPolicySources(root, async (path) => path.endsWith('repo')
    ? Array.from({ length: POLICY_DISCOVERY_LIMITS.maxFiles + 1 }, (_, index) => ({ name: `file${index}.mjs`, isDirectory: () => false, isFile: () => true }))
    : [])).rejects.toThrow(`file limit (${POLICY_DISCOVERY_LIMITS.maxFiles})`);
});
