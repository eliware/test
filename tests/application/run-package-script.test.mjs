import { dirname, join } from 'node:path';
import { resolveNpmArguments, resolveNpmCommand, runPackageScript } from '../../src/application/run-package-script.mjs';

test('resolves the platform npm executable', () => {
  expect(resolveNpmCommand()).toBe(process.platform === 'win32' ? process.execPath : 'npm');
  expect(resolveNpmCommand('win32')).toBe(process.execPath);
  expect(resolveNpmCommand('linux')).toBe('npm');
  expect(resolveNpmArguments('audit', 'linux')).toEqual(['run', 'audit']);
  expect(resolveNpmArguments('audit', 'win32')).toEqual(expect.arrayContaining(['run', 'audit']));
  expect(resolveNpmArguments('audit')).toEqual(expect.arrayContaining(['run', 'audit']));
  expect(resolveNpmArguments('audit', 'win32', 'npm.cmd')).toEqual(expect.arrayContaining(['run', 'audit']));
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
  expect(calls[0][0]).toBe(process.platform === 'win32' ? process.execPath : 'npm');
  expect(calls[0][1]).toEqual(expect.arrayContaining(['run', 'audit']));
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

test('normalizes a null child-process result', async () => {
  const messages = [];
  await expect(runPackageScript('.', 'audit', (message) => messages.push(message), {
    readPackageJson: async () => ({ scripts: { audit: 'audit-command' } }),
    runChildProcess: async () => null,
  })).resolves.toBe(1);
  expect(messages.join('')).toContain('audit failed.');
});

test('uses npm_execpath when it provides a JavaScript npm entrypoint on Windows', () => {
  expect(resolveNpmArguments('audit', 'win32', 'C:/npm/npm-cli.js')).toEqual(['C:/npm/npm-cli.js', 'run', 'audit']);
});

test('uses the Node-relative npm CLI when Windows provides no JavaScript entrypoint', () => {
  expect(resolveNpmArguments('audit', 'win32', 'C:/npm/npm.cmd')).toEqual([
    join('C:/npm', 'node_modules', 'npm', 'bin', 'npm-cli.js'), 'run', 'audit',
  ]);
});

test('uses the Node-relative npm CLI when Windows provides no npm path', () => {
  expect(resolveNpmArguments('audit', 'win32', null)).toEqual([
    join(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js'), 'run', 'audit',
  ]);
});

test('normalizes negative child exit codes to failure', async () => {
  await expect(runPackageScript('.', 'audit', () => {}, {
    readPackageJson: async () => ({ scripts: { audit: 'audit-command' } }),
    runChildProcess: async () => ({ code: -1, output: '' }),
  })).resolves.toBe(1);
});

test('uses a safe default writer for failed scripts', async () => {
  await expect(runPackageScript('.', 'audit', undefined, {
    readPackageJson: async () => ({ scripts: { audit: 'audit-command' } }),
    runChildProcess: async () => ({ code: 1, output: 'failed' }),
})).resolves.toBe(1);
});

test('normalizes child-process startup failures', async () => {
  const messages = [];
  await expect(runPackageScript('.', 'audit', (message) => messages.push(message), {
    readPackageJson: async () => ({ scripts: { audit: 'audit-command' } }),
    runChildProcess: async () => { throw new Error('spawn failed'); },
  })).resolves.toBe(1);
  expect(messages.join('')).toContain('audit failed: spawn failed');
});

test('uses a safe startup diagnostic when the rejection has no message', async () => {
  const messages = [];
  await expect(runPackageScript('.', 'audit', (message) => messages.push(message), {
    readPackageJson: async () => ({ scripts: { audit: 'audit-command' } }),
    runChildProcess: async () => { throw null; },
  })).resolves.toBe(1);
  expect(messages.join('')).toContain('audit failed: unable to start package script');
});
