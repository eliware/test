import { mapPathsToSources } from '../../../src/testing/focused-coverage/map-paths-to-sources.mjs';

test('maps a conventional test path to its source', async () => {
  await expect(mapPathsToSources('C:/repo', ['tests/a.test.mjs'], async (path) => {
    if (path.replaceAll('\\', '/').endsWith('src/a.mjs')) return;
    throw Object.assign(new Error('missing'), { code: 'ENOENT' });
  })).resolves.toEqual(['src/a.mjs']);
});

test('returns no mapping for non-conventional paths', async () => {
  await expect(mapPathsToSources('C:/repo', ['docs/a.test.mjs'])).resolves.toEqual([]);
});

test('rejects malformed path lists and ignores malformed candidates', async () => {
  await expect(mapPathsToSources('C:/repo', null)).rejects.toThrow(TypeError);
  await expect(mapPathsToSources('C:/repo', [null])).resolves.toEqual([]);
  await expect(mapPathsToSources('C:/repo', [])).resolves.toEqual([]);
});

test('rejects ambiguous mappings and propagates access failures', async () => {
  const present = async () => undefined;
  await expect(mapPathsToSources('C:/repo', ['tests/a.test.mjs'], present)).resolves.toEqual([]);
  await expect(mapPathsToSources('C:/repo', ['tests/a.test.mjs'], async () => {
    throw Object.assign(new Error('denied'), { code: 'EACCES' });
  })).rejects.toThrow('denied');
});
