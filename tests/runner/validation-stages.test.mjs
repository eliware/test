import { runBuildStage, runLintStage, runPackageStages, runTypecheckStage } from '../../src/runner/validation-stages.mjs';

test('runs and reports typecheck success', async () => {
  const calls = [];
  await expect(runTypecheckStage({ cwd: 'C:/repo', runTypecheck: async (...args) => { calls.push(args); return { code: 0, output: '' }; }, write: () => {} }, 'typecheck')).resolves.toBe(0);
  expect(calls[0][0]).toEqual(['run', 'typecheck']);
});

test('passes sanitized environment mode to typecheck', async () => {
  let options;
  await runTypecheckStage({ cwd: 'C:/repo', sanitizeEnv: true, runTypecheck: async (...args) => { options = args[1]; return { code: 0, output: '' }; }, write: () => {} }, 'typecheck');
  expect(options.inheritEnv).toBe(false);
});

test('fails clearly when typecheck fails or cannot start', async () => {
  const messages = [];
  await expect(runTypecheckStage({ cwd: 'C:/repo', runTypecheck: async () => ({ code: 1, output: 'bad' }), write: (message) => messages.push(message) }, 'typecheck')).resolves.toBe(19);
  await expect(runTypecheckStage({ cwd: 'C:/repo', runTypecheck: async () => { throw new Error('missing'); }, write: (message) => messages.push(message) }, 'typecheck')).resolves.toBe(19);
  expect(messages.join('')).toContain('Typecheck');
});

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
