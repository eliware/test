import { runToolkitLifecycle } from '../../src/public/run-toolkit-lifecycle.mjs';

test('runs the lifecycle stages and reports success', async () => {
  const messages = [];
  const context = {
    cwd: process.cwd(), runnerArguments: [], write: (message) => messages.push(message),
    runTest: async () => ({ code: 0, output: '' }), runLintCommand: async () => 0,
    runInBand: true, disableInBand: false, ignoreCoverage: true, ignoreMonolithLimits: true,
    enforceMonolithLimits: false, workers: 6, accessPath: async () => true, removePath: async () => {},
    readFilePath: async () => '{}', statPath: async () => ({ mtimeMs: 1 }), renamePath: async () => {},
    findIstanbulIgnores: async () => [], findMonolith: async () => [], findSourceTestMapping: async () => ({ missingTests: [], orphanTests: [] }),
    inspectWorkspace: async () => true, runChildProcess: async () => ({ code: 0, output: '' }),
    timing: { step: () => {} }, startedAt: 0, debugTiming: false,
  };
  await expect(runToolkitLifecycle(context)).resolves.toBe(0);
  expect(messages.join('')).toContain('Tests passed');
});
