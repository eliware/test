import { runTestCommand } from '../../src/application/run-test-command.mjs';

test('rejects test commands without required toolkit options', async () => {
  await expect(runTestCommand({})).rejects.toThrow(TypeError);
  await expect(runTestCommand({ cwd: 'workspace', write: () => {} })).rejects.toThrow(TypeError);
  await expect(runTestCommand({ runnerArguments: [], write: () => {} })).rejects.toThrow(TypeError);
});

test('requires a diagnostic writer before starting the toolkit', async () => {
  await expect(runTestCommand({ cwd: 'workspace', runnerArguments: [] })).rejects.toThrow(TypeError);
  await expect(runTestCommand({ cwd: 'workspace', runnerArguments: [], write: 'invalid' })).rejects.toThrow(TypeError);
});
