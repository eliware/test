import { validateFocusedPaths } from '../../src/testing/validate-focused-paths.mjs';

test('returns the first missing focused test path', async () => {
  await expect(validateFocusedPaths('C:/repo', ['tests/missing.test.mjs'], async () => {
    throw Object.assign(new Error('missing'), { code: 'ENOENT' });
  })).resolves.toBe('tests/missing.test.mjs');
});

test('accepts existing focused paths', async () => {
  await expect(validateFocusedPaths('C:/repo', ['tests/example.test.mjs'], async () => undefined)).resolves.toBe('');
});
