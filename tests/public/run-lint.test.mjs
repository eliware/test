import { runLint } from '../../src/public/run-lint.mjs';

test('delegates the public lint operation and returns its code', async () => {
  await expect(runLint({ cwd: 'C:/repo', write: () => {}, runLintCommand: async () => 0 })).resolves.toBe(0);
});

test('validates options and delegated exit codes', async () => {
  await expect(runLint(null)).rejects.toThrow(TypeError);
  await expect(runLint({ cwd: 42 })).rejects.toThrow(TypeError);
  await expect(runLint({ cwd: 'C:/repo', write: () => {}, runLintCommand: async () => 1.5 })).rejects.toThrow('integer exit code');
  await expect(runLint({ cwd: 'C:/repo', write: () => {}, runLintCommand: async () => 7 })).resolves.toBe(7);
  await expect(runLint({ cwd: 'C:/repo', runLintCommand: async () => 0 })).rejects.toThrow('write function');
});

test('uses an injected default command without launching the real linter', async () => {
  await expect(runLint(
    { cwd: 'C:/repo', write: () => {} },
    { defaultRunLintCommand: async () => 0 },
  )).resolves.toBe(0);
});

test('normalizes delegated lint failures to the internal exit code', async () => {
  const messages = [];
  await expect(runLint({ cwd: 'C:/repo', write: (message) => messages.push(message), runLintCommand: async () => { throw new Error('lint unavailable'); } })).resolves.toBe(14);
  expect(messages.join('')).toContain('lint unavailable');
});

test('formats non-Error delegated lint failures', async () => {
  const messages = [];
  await expect(runLint({ cwd: 'C:/repo', write: (message) => messages.push(message), runLintCommand: async () => { throw 'lint unavailable'; } })).resolves.toBe(14);
  expect(messages.join('')).toContain('lint unavailable');
});
