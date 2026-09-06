import { runToolkitLifecycle } from '../../src/public/run-toolkit-lifecycle.mjs';

test('runs the lifecycle stages and reports success', async () => {
  const messages = [];
  const context = {
    cwd: process.cwd(), runnerArguments: [], write: (message) => messages.push(message),
    runTest: async () => ({ code: 0, output: '' }), runLintCommand: async () => 0,
    runInBand: true, disableInBand: false, ignoreCoverage: false, ignoreMonolithLimits: true,
    enforceMonolithLimits: false, workers: 6, accessPath: async () => true, removePath: async () => {},
    readFilePath: async () => JSON.stringify({ 'src/example.mjs': { statementMap: { 0: { start: { line: 1 } } }, s: { 0: 1 }, b: {}, f: {} } }), statPath: async () => ({ mtimeMs: 1 }),
    findIstanbulIgnores: async () => [], findMonolith: async () => [], findSourceTestMapping: async () => ({ missingTests: [], orphanTests: [] }),
    inspectWorkspace: async () => true, runChildProcess: async () => ({ code: 0, output: '' }),
    timing: { step: () => {} }, startedAt: 0, debugTiming: false, validateConventions: async () => true,
  };
  await expect(runToolkitLifecycle(context)).resolves.toBe(0);
  expect(messages.join('')).toContain('Tests passed');
  expect(messages.filter((message) => message.includes('Lint passed: 0 warnings'))).toHaveLength(0);
});

const lifecycleContext = (overrides = {}) => ({
  cwd: process.cwd(), runnerArguments: [], write: () => {}, runTest: async () => ({ code: 0, output: '' }),
  runLintCommand: async () => 0, runInBand: true, disableInBand: false, ignoreCoverage: true,
  ignoreMonolithLimits: true, enforceMonolithLimits: false, workers: 6,
  accessPath: async () => true, removePath: async () => {}, readFilePath: async () => '', statPath: async () => ({ mtimeMs: 1 }),
  findIstanbulIgnores: async () => [], findMonolith: async () => [], findSourceTestMapping: async () => ({ missingTests: [], orphanTests: [] }),
  inspectWorkspace: async () => true, runChildProcess: async () => ({ code: 0, output: '' }),
  timing: { step: () => {} }, startedAt: 0, debugTiming: false, validateConventions: async () => true,
  ...overrides,
});

test('returns a preflight failure without executing tests', async () => {
  await expect(runToolkitLifecycle(lifecycleContext({ inspectWorkspace: async () => false }))).resolves.toBe(3);
});

test('returns the execution outcome before post-test validation', async () => {
  await expect(runToolkitLifecycle(lifecycleContext({ runTest: async () => ({ code: 9, output: 'failed' }) }))).resolves.toBe(9);
});

test('returns a post-test validation failure after execution succeeds', async () => {
  await expect(runToolkitLifecycle(lifecycleContext({ runLintCommand: async () => 13 }))).resolves.toBe(13);
});
