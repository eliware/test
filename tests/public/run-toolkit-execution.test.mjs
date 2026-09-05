import { runToolkitExecution } from '../../src/public/run-toolkit-execution.mjs';

const preparation = { focusedCoverage: [], focusedPathMode: false, timingOutput: null };

test('executes prepared tests and returns a normalized success', async () => {
  const calls = [];
  const runChildProcess = () => {};
  await expect(runToolkitExecution({ cwd: process.cwd(), args: [], runInBand: true, disableInBand: false, preparation, runChildProcess, runTest: async (args, options) => { calls.push([args, options]); return { code: 0, output: '' }; }, readFilePath: async () => '', removePath: async () => {}, write: () => {} })).resolves.toMatchObject({ outcome: null, testResult: { code: 0 } });
  expect(calls).toHaveLength(1);
  expect(calls[0][1].runChildProcess).toBe(runChildProcess);
});

test('returns the public test failure outcome', async () => {
  await expect(runToolkitExecution({ cwd: process.cwd(), args: [], runInBand: true, disableInBand: false, preparation, runTest: async () => ({ code: 1, output: 'failed' }), readFilePath: async () => '', removePath: async () => {}, write: () => {} })).resolves.toMatchObject({ outcome: 9 });
});

test('normalizes malformed test results as failures', async () => {
  await expect(runToolkitExecution({ cwd: process.cwd(), args: [], runInBand: true, disableInBand: false, preparation, runTest: async () => null, readFilePath: async () => '', removePath: async () => {}, write: () => {} })).resolves.toMatchObject({ outcome: 9 });
});
