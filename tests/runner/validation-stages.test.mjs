import { runBuildStage, runLintStage, runPackageStages } from '../../src/runner/validation-stages.mjs';

const context = (overrides = {}) => ({ cwd: process.cwd(), sanitizeEnv: false, write: () => {}, ...overrides });

test('runs a configured build and normalizes its result', async () => {
  const calls = [];
  await expect(runBuildStage(context({ runBuild: async (...args) => { calls.push(args); return { code: 0, output: 'built' }; } }), 'npm run build')).resolves.toBe(0);
  expect(calls[0][0]).toEqual(['run', 'build']);
});

test('rejects lint warnings even when lint exits successfully', async () => {
  await expect(runLintStage(context({ runLintCommand: async () => ({ code: 0, output: 'warning: unused' }), write: () => {} }))).resolves.toBe(13);
});

test('runs audit and pack in order', async () => {
  const calls = [];
  await expect(runPackageStages(context({ runAudit: async (args) => { calls.push(args[0]); return { code: 0, output: '' }; }, runPack: async (args) => { calls.push(args[0]); return { code: 0, output: '' }; } }))).resolves.toBe(0);
  expect(calls).toEqual(['audit', 'pack']);
});
