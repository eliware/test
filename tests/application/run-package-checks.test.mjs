import { runPackageChecks } from '../../src/application/run-package-checks.mjs';

test('normalizes the first defined package-check failure', async () => {
  const messages = [];
  await expect(runPackageChecks('.', (message) => messages.push(message), {
    readPackageJson: async () => ({ scripts: { audit: 'audit' } }),
    runChildProcess: async () => ({ code: 2, output: 'failed' }),
  })).resolves.toBe(17);
  expect(messages.join('')).toContain('Package script failed: audit');
});

test('skips undefined package checks', async () => {
  await expect(runPackageChecks('.', () => {}, { readPackageJson: async () => ({ scripts: {} }) })).resolves.toBe(0);
});
