import { runLintStage } from '../../../src/runner/validation/lint.mjs';
test('accepts clean lint output', async () => { await expect(runLintStage({ runLintCommand: async () => ({ code: 0, output: '' }), write: () => {} })).resolves.toBe(0); });
