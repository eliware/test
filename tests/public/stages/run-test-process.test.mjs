import { runTestProcess } from '../../../src/public/stages/run-test-process.mjs';

test('builds and executes Jest arguments and normalizes the result', async () => {
  const calls = [];
  await expect(runTestProcess({ cwd: 'repo', args: ['tests/example.test.mjs'], runInBand: true, focusedCoverage: [], focusedPathMode: true, timingOutput: false, coverageDirectory: undefined, runTest: async (args, options) => { calls.push({ args, options }); return { code: 0, output: '' }; }, runChildProcess: () => {} })).resolves.toMatchObject({ code: 0 });
  expect(calls[0].args).toContain('--coverage');
  expect(calls[0].options.cwd).toBe('repo');
});
