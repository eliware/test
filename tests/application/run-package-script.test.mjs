import { resolveNpmCommand, runPackageScript } from '../../src/application/run-package-script.mjs';

test('resolves the platform npm executable', () => {
  expect(resolveNpmCommand('win32')).toBe('npm.cmd');
  expect(resolveNpmCommand('linux')).toBe('npm');
});

test('skips scripts that are not defined', async () => {
  const result = await runPackageScript('.', 'audit', () => {}, { readPackageJson: async () => ({ scripts: {} }) });
  expect(result).toBe(0);
});

test('uses the workspace package metadata when no reader is injected', async () => {
  await expect(runPackageScript(process.cwd(), 'audit', () => {})).resolves.toBe(0);
});

test('runs defined scripts and returns their exit code', async () => {
  const calls = [];
  const result = await runPackageScript('.', 'audit', () => {}, {
    readPackageJson: async () => ({ scripts: { audit: 'audit-command' } }),
    runChildProcess: async (...args) => { calls.push(args); return { code: 3, output: 'failed' }; }
  });
  expect(result).toBe(3);
  expect(calls[0][0]).toBe(process.platform === 'win32' ? 'npm.cmd' : 'npm');
  expect(calls[0][1]).toEqual(['run', 'audit']);
});

test('reports script output and normalizes an invalid exit code', async () => {
  const messages = [];
  const result = await runPackageScript('.', 'build', (message) => messages.push(message), {
    readPackageJson: async () => ({ scripts: { build: 'build-command' } }),
    runChildProcess: async () => ({ code: 'failed', output: 'details' })
  });
  expect(result).toBe(1);
  expect(messages.join('')).toContain('build failed');
});

test('normalizes workspace paths in script failures', async () => {
  const messages = [];
  const cwd = 'C:/repo';
  await expect(runPackageScript(cwd, 'build', (message) => messages.push(message), {
    readPackageJson: async () => ({ scripts: { build: 'build-command' } }),
    runChildProcess: async () => ({ code: 1, output: 'error in C:/repo/src/file.mjs\n' })
  })).resolves.toBe(1);
  expect(messages.join('')).toContain('error in <workspace>/src/file.mjs');
  expect(messages.join('')).not.toContain('C:/repo/src/file.mjs');
});

test('reports a failed script without output', async () => {
  const messages = [];
  await expect(runPackageScript('.', 'typecheck', (message) => messages.push(message), {
    readPackageJson: async () => ({ scripts: { typecheck: 'typecheck-command' } }),
    runChildProcess: async () => ({ code: 1 })
  })).resolves.toBe(1);
  expect(messages.join('')).toContain('typecheck failed.');
});

test('uses a safe default writer for failed scripts', async () => {
  await expect(runPackageScript('.', 'audit', undefined, {
    readPackageJson: async () => ({ scripts: { audit: 'audit-command' } }),
    runChildProcess: async () => ({ code: 1, output: 'failed' }),
  })).resolves.toBe(1);
});
