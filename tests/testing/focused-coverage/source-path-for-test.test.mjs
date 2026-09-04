import { sourcePathForTest } from '../../../src/testing/focused-coverage/source-path-for-test.mjs';

test('returns no mapping for non-test paths', async () => {
  await expect(sourcePathForTest('C:/repo', 'README.md')).resolves.toBe('');
  await expect(sourcePathForTest('C:/repo', null)).resolves.toBe('');
});

test('normalizes relative and workspace-absolute test paths', async () => {
  const accessPath = async (path) => {
    if (path.replaceAll('\\', '/').endsWith('src/a.mjs')) return;
    throw Object.assign(new Error('missing'), { code: 'ENOENT' });
  };
  await expect(sourcePathForTest('C:/repo', '.\\tests\\a.test.mjs', accessPath)).resolves.toBe('src/a.mjs');
  await expect(sourcePathForTest('C:/repo', 'C:/repo/tests/a.test.mjs', accessPath)).resolves.toBe('src/a.mjs');
  await expect(sourcePathForTest('c:\\REPO', 'C:/repo/tests/a.test.mjs', accessPath)).resolves.toBe('src/a.mjs');
  await expect(sourcePathForTest('\\\\server\\share', '\\\\server\\share\\tests\\a.test.mjs', accessPath)).resolves.toBe('src/a.mjs');
  await expect(sourcePathForTest('/repo', '/repo/tests/a.test.mjs', accessPath)).resolves.toBe('src/a.mjs');
});

test('rejects test paths outside the workspace', async () => {
  const accessPath = async () => { throw Object.assign(new Error('missing'), { code: 'ENOENT' }); };
  await expect(sourcePathForTest('/repo', '../tests/a.test.mjs', accessPath)).resolves.toBe('');
  await expect(sourcePathForTest('C:/repo', 'C:/other/tests/a.test.mjs', accessPath)).resolves.toBe('');
});

test('rejects non-test filename suffixes', async () => {
  await expect(sourcePathForTest('/repo', 'tests/a.fixture.mjs', async () => {})).resolves.toBe('');
});

test('propagates unexpected source access failures', async () => {
  await expect(sourcePathForTest('/repo', 'tests/a.test.mjs', async () => {
    throw Object.assign(new Error('denied'), { code: 'EACCES' });
  })).rejects.toThrow('denied');
});
