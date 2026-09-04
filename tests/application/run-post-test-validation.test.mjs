import { jest } from '@jest/globals';
import { runPostTestValidation } from '../../src/application/run-post-test-validation.mjs';

test('runs lint after coverage and returns success', async () => {
  const steps = [];
  await expect(runPostTestValidation({ cwd: '.', testResult: { output: '' }, write: () => {}, readFilePath: async () => '{}', ignoreCoverage: true, runLintCommand: async () => 0, enforceMonolithLimits: false, timing: { step: (from) => steps.push(from) } })).resolves.toBeNull();
  expect(steps).toEqual(['Tests', 'Coverage', 'Lint', 'Monolith validation']);
});

test('returns coverage failures before lint', async () => {
  const lint = jest.fn();
  await expect(runPostTestValidation({ cwd: '.', testResult: { output: 'invalid coverage' }, write: () => {}, readFilePath: async () => { throw Object.assign(new Error('missing'), { code: 'ENOENT' }); }, ignoreCoverage: false, runLintCommand: lint, enforceMonolithLimits: false, timing: { step: () => {} } })).resolves.toBe(10);
  expect(lint).not.toHaveBeenCalled();
});

test('fails after existing validation when a package check fails', async () => {
  await expect(runPostTestValidation({
    cwd: '.', testResult: { output: '' }, write: () => {}, readFilePath: async () => '{}',
    ignoreCoverage: true, runLintCommand: async () => 0, enforceMonolithLimits: false,
    packageChecks: { readPackageJson: async () => ({ scripts: { audit: 'audit' } }), runChildProcess: async () => ({ code: 1, output: 'failed' }) },
    timing: { step: () => {} }
  })).resolves.toBe(17);
});
