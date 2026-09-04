import { runLintCommand } from '../../src/application/run-lint-command.mjs';

test('requires a diagnostic writer', async () => {
  await expect(runLintCommand({ cwd: 'C:/repo' })).rejects.toThrow(TypeError);
});

test('requires a working-directory path', async () => {
  await expect(runLintCommand({ cwd: '', write: () => {} })).rejects.toThrow(TypeError);
});

test('returns the workspace policy failure code', async () => {
  await expect(runLintCommand({ cwd: 'C:/repo', write: () => {}, inspect: async () => false }))
    .resolves.toBe(3);
});

test('reports workspace setup failures', async () => {
  const messages = [];
  await expect(runLintCommand({ cwd: 'C:/repo', write: (message) => messages.push(message), inspect: async () => { throw new Error('setup failed'); } }))
    .resolves.toBe(2);
  expect(messages.join('')).toContain('Workspace setup failed');
});

test('reports lint startup failures', async () => {
  const messages = [];
  await expect(runLintCommand({ cwd: 'C:/repo', write: (message) => messages.push(message), inspect: async () => true, runLint: async () => { throw new Error('oxlint missing'); } }))
    .resolves.toBe(12);
  expect(messages.join('')).toContain('Lint failed to start');
});

test('reports lint failures and warning output', async () => {
  const messages = [];
  const options = { cwd: 'C:/repo', write: (message) => messages.push(message), inspect: async () => true };
  await expect(runLintCommand({ ...options, runLint: async () => ({ code: 1, output: 'error' }) })).resolves.toBe(13);
  await expect(runLintCommand({ ...options, runLint: async () => ({ code: 0, output: 'warning: unused' }) })).resolves.toBe(13);
  await expect(runLintCommand({ ...options, runLint: async () => null })).resolves.toBe(13);
  await expect(runLintCommand({ ...options, runLint: async () => ({ code: 0, output: 7 }) })).resolves.toBe(0);
  expect(messages.join('')).toContain('Lint failed (exit 1)');
});

test('reports a successful lint run', async () => {
  const messages = [];
  await expect(runLintCommand({
    cwd: 'C:/repo', write: (message) => messages.push(message), inspect: async () => true,
    runLint: async () => ({ code: 0, output: '' })
  })).resolves.toBe(0);
  expect(messages.join('')).toContain('Lint passed: 0 warnings');
});
