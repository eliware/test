import { runToolkitPreflight } from '../../src/public/run-toolkit-preflight.mjs';

const context = (overrides = {}) => ({
  cwd: process.cwd(), runnerArguments: [], write: () => {}, accessPath: async () => true,
  removePath: async () => {}, findIstanbulIgnores: async () => [], inspect: async () => true,
  debugTiming: false, findSourceTestMapping: async () => ({ missingTests: [], orphanTests: [] }), timing: { step: () => {} }, ...overrides,
});

test('runs the preflight and returns prepared test inputs', async () => {
  await expect(runToolkitPreflight(context())).resolves.toMatchObject({ args: [], preparation: expect.any(Object) });
});

test('returns public outcomes for policy, argument, preparation, and cleanup failures', async () => {
  await expect(runToolkitPreflight(context({ inspect: async () => false }))).resolves.toMatchObject({ exitCode: 3 });
  await expect(runToolkitPreflight(context({ runnerArguments: ['--coverage'] }))).resolves.toMatchObject({ exitCode: 4 });
  await expect(runToolkitPreflight(context({ removePath: async () => { throw new Error('locked'); } }))).resolves.toMatchObject({ exitCode: 7 });
});

test('reports mapping drift but continues workspace inspection', async () => {
  let inspected = false;
  await expect(runToolkitPreflight(context({
    inspect: async () => { inspected = true; return true; },
    findSourceTestMapping: async () => ({ missingTests: ['missing'], orphanTests: [] }),
  }))).resolves.toMatchObject({ architecture: 16, args: [], preparation: expect.any(Object) });
  expect(inspected).toBe(true);
});
