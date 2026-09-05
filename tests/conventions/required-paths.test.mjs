import { findMissingRequiredPaths, REQUIRED_REPOSITORY_PATHS } from '../../src/conventions/required-paths.mjs';

test('reports missing required paths and honors exact exceptions', async () => {
  const present = new Set(REQUIRED_REPOSITORY_PATHS.slice(0, 2));
  await expect(findMissingRequiredPaths('repo', async (path) => {
    if (!present.has(path.replace('repo\\', ''))) throw new Error('missing');
  }, ['docs'])).resolves.toContain('examples');
  await expect(findMissingRequiredPaths('repo', async () => { throw new Error('missing'); }, REQUIRED_REPOSITORY_PATHS)).resolves.toEqual([]);
});

test('uses the default empty exception list', async () => {
  await expect(findMissingRequiredPaths('repo', async () => {})).resolves.toEqual([]);
});
