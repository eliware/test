import { validateFocusedPaths } from '../../src/testing/validate-focused-paths.mjs';

test('returns the first missing focused test path', async () => {
  await expect(validateFocusedPaths('C:/repo', ['tests/missing.test.mjs'], async () => {
    throw Object.assign(new Error('missing'), { code: 'ENOENT' });
  })).resolves.toBe('tests/missing.test.mjs');
});

test('accepts existing focused paths', async () => {
  await expect(validateFocusedPaths('C:/repo', ['tests/example.test.mjs'], async () => undefined, async () => ({ isFile: () => true }))).resolves.toBe('');
});

test('rejects an existing directory as a focused file path', async () => {
  await expect(validateFocusedPaths('C:/repo', ['tests/fixtures/dir.test.mjs'], async () => undefined, async () => ({ isFile: () => false })))
    .resolves.toBe('tests/fixtures/dir.test.mjs');
});

test('validates its inputs and propagates unexpected access errors', async () => {
  await expect(validateFocusedPaths(null, [])).rejects.toThrow(TypeError);
  await expect(validateFocusedPaths('C:/repo', null)).rejects.toThrow(TypeError);
  await expect(validateFocusedPaths('C:/repo', ['tests/example.test.mjs'], async () => {
    throw Object.assign(new Error('denied'), { code: 'EACCES' });
  })).rejects.toThrow('denied');
});

test('returns no missing path without touching the filesystem', async () => {
  await expect(validateFocusedPaths('C:/repo', [], async () => { throw new Error('unexpected'); })).resolves.toBe('');
  await expect(validateFocusedPaths('C:/repo', [])).resolves.toBe('');
});
