import { jest } from '@jest/globals';
import { runPostTestValidation } from '../../src/application/run-post-test-validation.mjs';

test('runs lint after coverage and returns success', async () => {
  const steps = [];
  await expect(runPostTestValidation({ cwd: '.', testResult: { output: '' }, write: () => {}, readFilePath: async () => '{}', ignoreCoverage: true, runLintCommand: async () => 0, enforceMonolithLimits: false, packageChecks: { runChildProcess: async () => ({ code: 0, output: '' }) }, timing: { step: (from) => steps.push(from) } })).resolves.toBeNull();
  expect(steps).toEqual(['Tests', 'Coverage', 'Lint', 'Monolith validation']);
});

test('reports coverage failures after running lint', async () => {
  const lint = jest.fn(async () => 0);
  await expect(runPostTestValidation({ cwd: '.', testResult: { output: 'invalid coverage' }, write: () => {}, readFilePath: async () => { throw Object.assign(new Error('missing'), { code: 'ENOENT' }); }, ignoreCoverage: false, runLintCommand: lint, enforceMonolithLimits: false, packageChecks: { runChildProcess: async () => ({ code: 0, output: '' }) }, timing: { step: () => {} } })).resolves.toBe(10);
  expect(lint).toHaveBeenCalled();
});

test('fails after existing validation when a package check fails', async () => {
  await expect(runPostTestValidation({
    cwd: '.', testResult: { output: '' }, write: () => {}, readFilePath: async () => '{}',
    ignoreCoverage: true, runLintCommand: async () => 0, enforceMonolithLimits: false,
    packageChecks: { readPackageJson: async () => ({ scripts: { audit: 'audit' } }), runChildProcess: async () => ({ code: 1, output: 'failed' }) },
    timing: { step: () => {} }
  })).resolves.toBe(17);
});

test('uses default package-check options', async () => {
  await expect(runPostTestValidation({
    cwd: '.', testResult: { output: '' }, write: () => {}, ignoreCoverage: true,
    runLintCommand: async () => 0, enforceMonolithLimits: false,
    timing: { step: () => {} },
  })).resolves.toBeNull();
});
