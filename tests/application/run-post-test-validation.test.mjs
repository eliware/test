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

test('uses later package failure precedence while retaining coverage diagnostics', async () => {
  const messages = [];
  await expect(runPostTestValidation({
    cwd: '.', testResult: { output: '' }, write: (message) => messages.push(message),
    coverageValidator: async () => 11, ignoreCoverage: false, runLintCommand: async () => 0,
    enforceMonolithLimits: false, packageChecks: { readPackageJson: async () => ({ scripts: { audit: 'audit', pack: 'pack', build: 'build', typecheck: 'typecheck' } }), runChildProcess: async () => ({ code: 1, output: 'failed' }) },
    timing: { step: () => {} },
  })).resolves.toBe(17);
  expect(messages).toContain('Package script failed: audit\n');
});

test('continues through monolith and package checks after lint failure', async () => {
  const findMonolith = jest.fn(async () => []);
  const runChildProcess = jest.fn(async () => ({ code: 0, output: '' }));
  await expect(runPostTestValidation({
    cwd: '.', testResult: { output: '' }, write: () => {}, ignoreCoverage: true,
    runLintCommand: async () => 13, enforceMonolithLimits: true, findMonolith,
    packageChecks: { readPackageJson: async () => ({ scripts: { audit: 'audit', pack: 'pack', build: 'build', typecheck: 'typecheck' } }), runChildProcess },
    timing: { step: () => {} },
  })).resolves.toBe(13);
  expect(findMonolith).toHaveBeenCalled();
  expect(runChildProcess).toHaveBeenCalled();

  const primitiveMessages = [];
  await expect(runPostTestValidation({
    cwd: '.', testResult: { output: '' }, write: (message) => primitiveMessages.push(message),
    coverageValidator: async () => { throw 'coverage primitive failed'; },
    runLintCommand: async () => 0, enforceMonolithLimits: false,
    packageChecks: { runChildProcess: async () => ({ code: 0, output: '' }) },
    timing: { step: () => {} },
  })).resolves.toBe(10);
  expect(primitiveMessages).toContain('Coverage validation failed: coverage primitive failed\n');
});

test('fails after existing validation when a package check fails', async () => {
  await expect(runPostTestValidation({
    cwd: '.', testResult: { output: '' }, write: () => {}, readFilePath: async () => '{}',
    ignoreCoverage: true, runLintCommand: async () => 0, enforceMonolithLimits: false,
    packageChecks: { readPackageJson: async () => ({ scripts: { audit: 'audit', pack: 'pack', build: 'build', typecheck: 'typecheck' } }), runChildProcess: async () => ({ code: 1, output: 'failed' }) },
    timing: { step: () => {} }
  })).resolves.toBe(17);
});

test('returns the highest post-test failure code after every stage runs', async () => {
  const findMonolith = jest.fn(async () => [{ file: 'src/large.mjs', lines: 101, kind: 'source' }]);
  const runChildProcess = jest.fn(async () => ({ code: 0, output: '' }));
  await expect(runPostTestValidation({
    cwd: '.', testResult: { output: '' }, write: () => {}, coverageValidator: async () => 10,
    runLintCommand: async () => 13, enforceMonolithLimits: true, findMonolith,
    packageChecks: { readPackageJson: async () => ({ scripts: { audit: 'audit', pack: 'pack', build: 'build', typecheck: 'typecheck' } }), runChildProcess }, timing: { step: () => {} },
  })).resolves.toBe(15);
  expect(findMonolith).toHaveBeenCalled();
  expect(runChildProcess).toHaveBeenCalled();
});

test('uses default package-check options', async () => {
  await expect(runPostTestValidation({
    cwd: '.', testResult: { output: '' }, write: () => {}, ignoreCoverage: true,
    runLintCommand: async () => 0, enforceMonolithLimits: false,
    timing: { step: () => {} },
})).resolves.toBeNull();
});

test('normalizes malformed coverage-stage results to a coverage failure', async () => {
  await expect(runPostTestValidation({
    cwd: '.', testResult: { output: '' }, write: () => {}, ignoreCoverage: false,
    coverageValidator: async () => ({ unexpected: true }), runLintCommand: async () => 0,
    enforceMonolithLimits: false, packageChecks: { runChildProcess: async () => ({ code: 0, output: '' }) },
    timing: { step: () => {} },
  })).resolves.toBe(10);
});

test('normalizes rejected coverage validation and continues later checks', async () => {
  const lint = jest.fn(async () => 0);
  const findMonolith = jest.fn(async () => []);
  const runChildProcess = jest.fn(async () => ({ code: 0, output: '' }));
  const messages = [];
  await expect(runPostTestValidation({
    cwd: '.', testResult: { output: '' }, write: (message) => messages.push(message),
    coverageValidator: async () => { throw new Error('coverage collaborator failed'); },
    runLintCommand: lint, enforceMonolithLimits: true, findMonolith,
    packageChecks: { readPackageJson: async () => ({ scripts: { audit: 'audit', pack: 'pack', build: 'build', typecheck: 'typecheck' } }), runChildProcess },
    timing: { step: () => {} },
  })).resolves.toBe(10);
  expect(messages).toContain('Coverage validation failed: coverage collaborator failed\n');
  expect(lint).toHaveBeenCalled();
  expect(findMonolith).toHaveBeenCalled();
  expect(runChildProcess).toHaveBeenCalled();
});

test('normalizes rejected lint validation and continues later checks', async () => {
  const findMonolith = jest.fn(async () => []);
  const runChildProcess = jest.fn(async () => ({ code: 0, output: '' }));
  const messages = [];
  await expect(runPostTestValidation({
    cwd: '.', testResult: { output: '' }, write: (message) => messages.push(message),
    ignoreCoverage: true, runLintCommand: async () => { throw new Error('lint collaborator failed'); },
    enforceMonolithLimits: true, findMonolith,
    packageChecks: { readPackageJson: async () => ({ scripts: { audit: 'audit', pack: 'pack', build: 'build', typecheck: 'typecheck' } }), runChildProcess },
    timing: { step: () => {} },
  })).resolves.toBe(13);
  expect(messages).toContain('Lint validation failed: lint collaborator failed\n');
  expect(findMonolith).toHaveBeenCalled();
  expect(runChildProcess).toHaveBeenCalled();

  const primitiveMessages = [];
  await expect(runPostTestValidation({
    cwd: '.', testResult: { output: '' }, write: (message) => primitiveMessages.push(message),
    ignoreCoverage: true, runLintCommand: async () => { throw 'lint primitive failed'; },
    enforceMonolithLimits: false, packageChecks: { runChildProcess: async () => ({ code: 0, output: '' }) },
    timing: { step: () => {} },
  })).resolves.toBe(13);
  expect(primitiveMessages).toContain('Lint validation failed: lint primitive failed\n');
});

test('passes the package reader through to package checks', async () => {
  const readPackageJson = jest.fn(async () => ({ scripts: { audit: 'audit', pack: 'pack', build: 'build', typecheck: 'typecheck' } }));
  await expect(runPostTestValidation({
    cwd: '.', testResult: { output: '' }, write: () => {}, ignoreCoverage: true,
    runLintCommand: async () => 0, enforceMonolithLimits: false,
    packageChecks: { readPackageJson, runChildProcess: async () => ({ code: 0, output: '' }) }, timing: { step: () => {} },
  })).resolves.toBeNull();
  expect(readPackageJson).toHaveBeenCalledWith('.', undefined);
});
