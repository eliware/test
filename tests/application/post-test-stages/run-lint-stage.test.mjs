import { runLintStage } from '../../../src/application/post-test-stages/run-lint-stage.mjs';
import { jest } from '@jest/globals';

test('passes lint options and normalizes rejected validation', async () => {
  const runLintCommand = jest.fn(async () => 0);
  await expect(runLintStage({ cwd: '.', write: () => {}, runLintCommand, lintOptions: { accessPath: 'safe' } })).resolves.toBe(0);
  expect(runLintCommand).toHaveBeenCalledWith({ accessPath: 'safe', cwd: '.', write: expect.any(Function), reportSuccess: false });
  const messages = [];
  await expect(runLintStage({ cwd: '.', write: (message) => messages.push(message), runLintCommand: async () => { throw new Error('failed'); } })).resolves.toBe(13);
  expect(messages).toContain('Lint validation failed: failed\n');
});
