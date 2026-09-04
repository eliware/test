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

test('uses the bundled lint command by default', async () => {
  await expect(runLint({ cwd: process.cwd(), write: () => {} })).resolves.toBe(0);
});
