import { assertExitCode, assertLintOptions, assertToolkitOptions } from '../../src/public/contracts.mjs';

test('validates toolkit and lint contracts', () => {
  const toolkit = { cwd: 'C:/repo', runnerArguments: [], write: () => {} };
  expect(assertToolkitOptions(toolkit)).toBe(toolkit);
  expect(assertLintOptions({ cwd: 'C:/repo', write: () => {} }).cwd).toBe('C:/repo');
});

test('rejects incomplete contracts and non-integer exit codes', () => {
  expect(() => assertToolkitOptions({})).toThrow(TypeError);
  expect(() => assertLintOptions({ cwd: 'C:/repo' })).toThrow(TypeError);
  expect(() => assertExitCode(1.5, 'operation')).toThrow(TypeError);
  expect(assertExitCode(0, 'operation')).toBe(0);
});
