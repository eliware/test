import { validateToolkitOptions } from '../../src/public/validate-toolkit-options.mjs';

test('validates the toolkit contract', () => {
  const options = { cwd: '.', runnerArguments: [], write: () => {} };
  expect(validateToolkitOptions(options)).toBe(options);
  expect(() => validateToolkitOptions({})).toThrow();
  expect(() => validateToolkitOptions({ ...options, runTest: true })).toThrow('option runTest');
  expect(() => validateToolkitOptions({ ...options, ignoreCoverage: 'yes' })).toThrow('must be boolean');
  expect(() => validateToolkitOptions({ ...options, workers: 0 })).toThrow('positive integer');
  expect(() => validateToolkitOptions({ ...options, workers: '6' })).toThrow('positive integer');
});
