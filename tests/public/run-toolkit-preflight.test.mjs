import { runToolkitPreflight } from '../../src/public/run-toolkit-preflight.mjs';

const context = (overrides = {}) => ({
  cwd: process.cwd(), runnerArguments: [], write: () => {}, accessPath: async () => true,
  removePath: async () => {}, findIstanbulIgnores: async () => [], inspect: async () => true,
  debugTiming: false, findSourceTestMapping: async () => null, timing: { step: () => {} }, ...overrides,
});

test('runs the preflight and returns prepared test inputs', async () => {
  await expect(runToolkitPreflight(context())).resolves.toMatchObject({ args: [], preparation: expect.any(Object) });
});

test('returns public outcomes for policy, argument, preparation, and cleanup failures', async () => {
  await expect(runToolkitPreflight(context({ inspect: async () => false }))).resolves.toMatchObject({ exitCode: 3 });
  await expect(runToolkitPreflight(context({ runnerArguments: ['--coverage'] }))).resolves.toMatchObject({ exitCode: 4 });
  await expect(runToolkitPreflight(context({ removePath: async () => { throw new Error('locked'); } }))).resolves.toMatchObject({ exitCode: 7 });
});
