import { resolveFocusedCoverage } from '../../../src/testing/focused-coverage/resolve-selection.mjs';

test('creates focused coverage arguments for mapped files', async () => {
  await expect(resolveFocusedCoverage('C:/repo', ['tests/a.test.mjs'], async (path) => {
    if (path.replaceAll('\\', '/').endsWith('src/a.mjs')) return;
    throw Object.assign(new Error('missing'), { code: 'ENOENT' });
  })).resolves.toEqual(['--collectCoverageFrom', 'src/a.mjs']);
});
