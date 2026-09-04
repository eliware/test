import { sourcePathForTest } from '../../../src/testing/focused-coverage/source-path-for-test.mjs';

test('returns no mapping for non-test paths', async () => {
  await expect(sourcePathForTest('C:/repo', 'README.md')).resolves.toBe('');
});

test('normalizes relative and workspace-absolute test paths', async () => {
  const accessPath = async (path) => {
    if (path.replaceAll('\\', '/').endsWith('src/a.mjs')) return;
    throw Object.assign(new Error('missing'), { code: 'ENOENT' });
  };
  await expect(sourcePathForTest('C:/repo', '.\\tests\\a.test.mjs', accessPath)).resolves.toBe('src/a.mjs');
  await expect(sourcePathForTest('C:/repo', 'C:/repo/tests/a.test.mjs', accessPath)).resolves.toBe('src/a.mjs');
  await expect(sourcePathForTest('c:\\REPO', 'C:/repo/tests/a.test.mjs', accessPath)).resolves.toBe('src/a.mjs');
  await expect(sourcePathForTest('/repo', '/repo/tests/a.test.mjs', accessPath)).resolves.toBe('src/a.mjs');
});
