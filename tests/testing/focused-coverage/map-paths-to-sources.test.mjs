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
