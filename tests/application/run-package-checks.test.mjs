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

test('uses the default options object', async () => {
  await expect(runPackageChecks('.', () => {})).resolves.toBe(0);
});

test('normalizes malformed package-check results', async () => {
  const messages = [];
  await expect(runPackageChecks('.', (message) => messages.push(message), {
    checks: [['audit', async () => undefined]],
  })).resolves.toBe(17);
  expect(messages.join('')).toContain('Package script failed: audit');
});

test('maps thrown package-check errors to package-script failure', async () => {
  const messages = [];
  await expect(runPackageChecks('.', (message) => messages.push(message), {
    checks: [['audit', async () => { throw new Error('audit unavailable'); }]],
  })).resolves.toBe(17);
  expect(messages.join('')).toContain('audit unavailable');
});

test('normalizes non-error package-check throws', async () => {
  const messages = [];
  await expect(runPackageChecks('.', (message) => messages.push(message), {
    checks: [['audit', async () => { throw {}; }]],
  })).resolves.toBe(17);
  expect(messages).toEqual(['Package script failed: audit\n']);
});
