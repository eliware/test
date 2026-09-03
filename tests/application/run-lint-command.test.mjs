import { runLintCommand } from '../../src/application/run-lint-command.mjs';

test('requires a diagnostic writer', async () => {
  await expect(runLintCommand({ cwd: 'C:/repo' })).rejects.toThrow(TypeError);
});

test('requires a working-directory path', async () => {
  await expect(runLintCommand({ cwd: '', write: () => {} })).rejects.toThrow(TypeError);
});
