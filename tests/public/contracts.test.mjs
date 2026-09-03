import { assertExitCode, assertLintOptions, assertToolkitOptions } from '../../src/public/contracts.mjs';

test('validates toolkit and lint contracts', () => {
  const toolkit = { cwd: 'C:/repo', runnerArguments: [], write: () => {} };
  expect(assertToolkitOptions(toolkit)).toBe(toolkit);
  expect(assertLintOptions({ cwd: 'C:/repo', write: () => {} }).cwd).toBe('C:/repo');
});

test('rejects incomplete contracts and non-integer exit codes', () => {
  expect(() => assertToolkitOptions(null)).toThrow(TypeError);
  expect(() => assertToolkitOptions({})).toThrow(TypeError);
  expect(() => assertToolkitOptions({ cwd: 'C:/repo', runnerArguments: [] })).toThrow('write function');
  expect(() => assertToolkitOptions({ cwd: 42, runnerArguments: [], write: () => {} })).toThrow('cwd and runnerArguments');
  expect(() => assertLintOptions({ cwd: 'C:/repo' })).toThrow(TypeError);
  expect(() => assertLintOptions(null)).toThrow(TypeError);
  expect(() => assertLintOptions({ cwd: '' , write: () => {} })).toThrow('lint requires cwd');
  expect(() => assertExitCode(1.5, 'operation')).toThrow(TypeError);
  expect(assertExitCode(0, 'operation')).toBe(0);
});
