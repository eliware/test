import { runLintCommand } from '../../src/application/run-lint-command.mjs';

test('rejects a lint command without a working directory', async () => {
  await expect(runLintCommand({})).rejects.toThrow(TypeError);
  await expect(runLintCommand({ cwd: '', write: () => {} })).rejects.toThrow(TypeError);
});

test('rejects a lint command with a non-function writer', async () => {
  await expect(runLintCommand({ cwd: 'workspace', write: null })).rejects.toThrow(TypeError);
  await expect(runLintCommand({ cwd: 'workspace', write: 'not-a-function' })).rejects.toThrow(TypeError);
});
