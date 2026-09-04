import { inspectLintWorkspace } from '../../src/application/lint-workspace.mjs';
test('maps workspace inspection outcomes', async () => { expect(await inspectLintWorkspace({ cwd: '.', write: () => {}, inspect: async () => true })).toBe(0); expect(await inspectLintWorkspace({ cwd: '.', write: () => {}, inspect: async () => false })).toBe(3); });
