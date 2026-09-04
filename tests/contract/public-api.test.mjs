import {
  assertExitCode,
  assertLintOptions,
  assertToolkitOptions
} from '../../src/public/contracts.mjs';

const write = () => {};

test('accepts valid toolkit options', () => {
  const options = { cwd: 'workspace', runnerArguments: [], write };
  expect(assertToolkitOptions(options)).toBe(options);
});

test('preserves the supplied operation name in toolkit errors', () => {
  expect(() => assertExitCode(1, 'customOperation')).not.toThrow();
  expect(() => assertExitCode('bad', 'customOperation')).toThrow('customOperation');
});

test('requires cwd and a writer for lint options', () => {
  expect(() => assertLintOptions({ write })).toThrow('lint requires cwd');
  expect(() => assertLintOptions({ cwd: 'workspace' })).toThrow('lint requires a write function');
});

test('rejects incomplete toolkit and lint options', () => {
  expect(() => assertToolkitOptions({})).toThrow(TypeError);
  expect(() => assertLintOptions({ cwd: 'workspace' })).toThrow(TypeError);
});

test('accepts only integer exit codes', () => {
  expect(assertExitCode(0, 'runToolkit')).toBe(0);
  expect(() => assertExitCode('0', 'runToolkit')).toThrow(TypeError);
  expect(() => assertExitCode(0.5, 'runToolkit')).toThrow(TypeError);
});

test('exposes the complete public contract surface', async () => {
  const publicApi = await import('../../src/public/contracts.mjs');
  expect(typeof publicApi.assertToolkitOptions).toBe('function');
  expect(typeof publicApi.assertLintOptions).toBe('function');
  expect(typeof publicApi.assertExitCode).toBe('function');
});
