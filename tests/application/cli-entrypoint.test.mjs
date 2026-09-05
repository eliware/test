import { jest } from '@jest/globals';
import { runCli } from '../../src/application/cli-entrypoint.mjs';

test('handles version and help modes', async () => {
  const output = [];
  await expect(runCli(['--version'], { write: (value) => output.push(value), packageMetadata: { version: '9.9.9' } })).resolves.toBe(0);
  await expect(runCli(['--help'], { write: (value) => output.push(value) })).resolves.toBe(0);
  expect(output.join('')).toContain('9.9.9');
  expect(output.join('')).toContain('eliware-test');
});

test('forwards the monolith opt-out from CLI parsing to the toolkit', async () => {
  let received;
  await expect(runCli(['--ignore-monolith-limits'], {
    runToolkit: async (options) => { received = options; return 0; },
    write: () => {}
  })).resolves.toBe(0);
  expect(received).toMatchObject({ ignoreMonolithLimits: true, enforceMonolithLimits: true });
});

test('dispatches lint and toolkit modes', async () => {
  const calls = [];
  const runLint = async (options) => { calls.push(['lint', options]); return 12; };
  const runToolkit = async (options) => { calls.push(['toolkit', options]); return 0; };
  await expect(runCli(['--lint'], { runLint, runToolkit, cwd: 'repo', write: () => {} })).resolves.toBe(12);
  await expect(runCli([], { runLint, runToolkit, cwd: 'repo', write: () => {} })).resolves.toBe(0);
  expect(calls[0][0]).toBe('lint');
  expect(calls[1][1]).toMatchObject({ cwd: 'repo', enforceMonolithLimits: true });
});

test('normalizes CLI setup failures', async () => {
  const errors = [];
  await expect(runCli(['--lint', 'tests/a.test.mjs'], { writeError: (value) => errors.push(value) })).resolves.toBe(4);
  expect(errors.join('')).toContain('Argument validation failed');
  expect(errors.join('')).not.toContain('Workspace setup failed');
});

test('supports the real default output writers', async () => {
  const stdout = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
  const stderr = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
  await expect(runCli(['--version'], { packageMetadata: { version: '1.0.0' } })).resolves.toBe(0);
  await expect(runCli(['--lint', 'tests/a.test.mjs'])).resolves.toBe(4);
  expect(stdout).toHaveBeenCalled();
  expect(stderr).toHaveBeenCalled();
  stdout.mockRestore();
  stderr.mockRestore();
});

test('classifies downstream dispatch failures as internal errors', async () => {
  const errors = [];
  await expect(runCli([], { runToolkit: async () => { throw new Error('pipeline failed'); }, write: () => {}, writeError: (value) => errors.push(value) })).resolves.toBe(14);
  expect(errors.join('')).toContain('Validation failed: pipeline failed');
});

test('normalizes non-Error downstream failures', async () => {
  const errors = [];
  await expect(runCli([], { runToolkit: async () => { throw 'pipeline failed'; }, write: () => {}, writeError: (value) => errors.push(value) })).resolves.toBe(14);
  expect(errors.join('')).toContain('Validation failed: pipeline failed');
});
