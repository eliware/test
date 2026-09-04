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

test('fails after workspace policy when mapping drifts', async () => {
  let inspected = false;
  await expect(runToolkitPreflight(context({
    inspect: async () => { inspected = true; return true; },
    findSourceTestMapping: async () => ({ missingTests: ['missing'], orphanTests: [] }),
  }))).resolves.toEqual({ exitCode: 16 });
  expect(inspected).toBe(true);
});

test('runs policy before reporting mapping drift', async () => {
  const order = [];
  await expect(runToolkitPreflight(context({
    inspect: async () => { order.push('policy'); return true; },
    findSourceTestMapping: async () => { order.push('mapping'); return { missingTests: ['missing'], orphanTests: [] }; },
    removePath: async () => { order.push('cleanup'); },
  }))).resolves.toEqual({ exitCode: 16 });
  expect(order[0]).toBe('policy');
  expect(order.at(-1)).toBe('mapping');
});
