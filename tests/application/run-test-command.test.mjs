import { runTestCommand } from '../../src/application/run-test-command.mjs';

test('requires the toolkit caller contract', async () => {
  await expect(runTestCommand({ cwd: 'C:/repo', runnerArguments: [] })).rejects.toThrow(TypeError);
});
