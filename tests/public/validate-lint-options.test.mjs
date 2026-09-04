import { validateLintOptions } from '../../src/public/validate-lint-options.mjs';

test('validates the lint contract', () => {
  expect(validateLintOptions({ cwd: '.', write: () => {} }).cwd).toBe('.');
  expect(() => validateLintOptions(null)).toThrow('lint options are required');
  expect(() => validateLintOptions({ cwd: '', write: () => {} })).toThrow('lint requires cwd');
  expect(() => validateLintOptions({ cwd: '.' })).toThrow('write function');
});
