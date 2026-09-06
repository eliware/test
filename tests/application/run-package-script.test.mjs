import { runPackageScript } from '../../src/application/run-package-script.mjs';

test('fails when scripts are not defined', async () => {
  const result = await runPackageScript('.', 'audit', () => {}, { readPackageJson: async () => ({ scripts: {} }) });
  expect(result).toMatchObject({ code: 1, category: 'package-script', script: 'audit' });
  await expect(runPackageScript('.', 'audit', () => {}, { readPackageJson: async () => null })).resolves.toMatchObject({ code: 1, category: 'package-script' });
});

test('uses the workspace package metadata when no reader is injected', async () => {
  await expect(runPackageScript(process.cwd(), 'audit', () => {})).resolves.toMatchObject({ code: 0, category: 'package-script' });
});

test('runs defined scripts and returns their exit code', async () => {
  const calls = [];
  const result = await runPackageScript('.', 'audit', () => {}, {
    readPackageJson: async () => ({ scripts: { audit: 'audit-command' } }),
    runChildProcess: async (...args) => { calls.push(args); return { code: 3, output: 'failed' }; }
  });
  expect(result).toMatchObject({ code: 3, category: 'package-script', script: 'audit', output: 'failed', diagnostic: expect.stringContaining('audit failed') });
  expect(calls[0][0]).toBe(process.platform === 'win32' ? process.execPath : 'npm');
  expect(calls[0][1]).toEqual(expect.arrayContaining(['run', 'audit']));
});

test('reports script output and normalizes an invalid exit code', async () => {
  const messages = [];
  const result = await runPackageScript('.', 'build', (message) => messages.push(message), {
    readPackageJson: async () => ({ scripts: { build: 'build-command' } }),
    runChildProcess: async () => ({ code: 'failed', output: 'details' })
  });
  expect(result).toMatchObject({ code: 1, category: 'package-script', script: 'build', output: 'details', diagnostic: expect.stringContaining('build failed') });
  expect(messages.join('')).toContain('build failed');
});

test('normalizes negative child exit codes and uses a default writer', async () => {
  await expect(runPackageScript('.', 'audit', undefined, { readPackageJson: async () => ({ scripts: { audit: 'audit-command' } }), runChildProcess: async () => ({ code: -1, output: 'failed' }) })).resolves.toMatchObject({ code: 1, category: 'package-script' });
});

test('normalizes workspace paths in script failures', async () => {
  const messages = [];
  const cwd = 'C:/repo';
  await expect(runPackageScript(cwd, 'build', (message) => messages.push(message), {
    readPackageJson: async () => ({ scripts: { build: 'build-command' } }),
    runChildProcess: async () => ({ code: 1, output: 'error in C:/repo/src/file.mjs\n' })
  })).resolves.toMatchObject({ code: 1, category: 'package-script' });
  expect(messages.join('')).toContain('error in <workspace>/src/file.mjs');
  expect(messages.join('')).not.toContain('C:/repo/src/file.mjs');
});

test('reports a failed script without output', async () => {
  const messages = [];
  await expect(runPackageScript('.', 'typecheck', (message) => messages.push(message), {
    readPackageJson: async () => ({ scripts: { typecheck: 'typecheck-command' } }),
    runChildProcess: async () => ({ code: 1 })
  })).resolves.toMatchObject({ code: 1, category: 'package-script' });
  expect(messages.join('')).toContain('typecheck failed.');
});

test('normalizes a null child-process result', async () => {
  const messages = [];
  await expect(runPackageScript('.', 'audit', (message) => messages.push(message), {
    readPackageJson: async () => ({ scripts: { audit: 'audit-command' } }),
    runChildProcess: async () => null,
  })).resolves.toMatchObject({ code: 1, category: 'package-script' });
  expect(messages.join('')).toContain('audit failed.');
});

test('normalizes child-process startup failures', async () => {
  const messages = [];
  await expect(runPackageScript('.', 'audit', (message) => messages.push(message), {
    readPackageJson: async () => ({ scripts: { audit: 'audit-command' } }),
    runChildProcess: async () => { throw new Error('spawn failed'); },
  })).resolves.toMatchObject({ code: 1, category: 'package-script' });
  expect(messages.join('')).toContain('audit failed: spawn failed');
});

test('uses a safe startup diagnostic when the rejection has no message', async () => {
  const messages = [];
  await expect(runPackageScript('.', 'audit', (message) => messages.push(message), {
    readPackageJson: async () => ({ scripts: { audit: 'audit-command' } }),
    runChildProcess: async () => { throw null; },
  })).resolves.toMatchObject({ code: 1, category: 'package-script' });
  expect(messages.join('')).toContain('audit failed: unable to start package script');
});

test('normalizes unreadable package metadata to a package failure', async () => {
  const messages = [];
  await expect(runPackageScript('.', 'audit', (message) => messages.push(message), {
    readPackageJson: async () => { throw new Error('invalid package'); },
  })).resolves.toMatchObject({ code: 1, category: 'package-script' });
  expect(messages.join('')).toContain('audit failed: invalid package');
});

test('uses a safe metadata diagnostic when the reader rejects without a message', async () => {
  const messages = [];
  await expect(runPackageScript('.', 'audit', (message) => messages.push(message), {
    readPackageJson: async () => { throw null; },
  })).resolves.toMatchObject({ code: 1, category: 'package-script' });
  expect(messages.join('')).toContain('audit failed: unable to read package metadata');
});
