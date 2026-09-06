import { runToolkit as runToolkitResult } from '../../src/public/run-toolkit.mjs';

const runToolkit = async (options) => {
  if (!options || typeof options !== 'object') return (await runToolkitResult(options)).code;
  return (await runToolkitResult({
    ...options,
    runChildProcess: async () => ({ code: 0, output: '' }),
    validateConventions: async () => true,
  })).code;
};

test('requires the toolkit caller contract', async () => {
  await expect(runToolkit(null)).resolves.toBe(14);
  await expect(runToolkit({ cwd: 'C:/repo', runnerArguments: null })).resolves.toBe(14);
  await expect(runToolkit({ cwd: 'C:/repo', runnerArguments: [] })).resolves.toBe(14);
});

test('composes preflight, execution, and post-test success', async () => {
  const messages = [];
  await expect(runToolkit({
    cwd: process.cwd(), runnerArguments: [], write: (message) => messages.push(message),
    ignoreCoverage: true, runTest: async () => ({ code: 0, output: '' }), runLintCommand: async () => 0,
  })).resolves.toBe(0);
  expect(messages.join('')).toContain('Tests passed');
});

test('returns the execution failure without running post-test stages', async () => {
  const messages = [];
  await expect(runToolkit({
    cwd: process.cwd(), runnerArguments: [], write: (message) => messages.push(message),
    runTest: async () => ({ code: 9, output: 'failed' }), runLintCommand: async () => 0,
  })).resolves.toBe(9);
});

test('normalizes unexpected lifecycle failures at the composition boundary', async () => {
  const messages = [];
  await expect(runToolkit({
    cwd: process.cwd(), runnerArguments: [], write: (message) => messages.push(message),
    inspectWorkspace: async () => { throw new Error('workspace inspection failed'); },
    runTest: async () => ({ code: 0, output: '' }), runLintCommand: async () => 0,
  })).resolves.toBe(14);
  expect(messages.join('')).toContain('workspace inspection failed');
});
