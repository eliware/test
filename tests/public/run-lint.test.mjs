import { runLint } from '../../src/public/run-lint.mjs';

test('delegates the public lint operation and returns its code', async () => {
  await expect(runLint({ cwd: 'C:/repo', write: () => {}, runLintCommand: async () => 0 })).resolves.toBe(0);
});
