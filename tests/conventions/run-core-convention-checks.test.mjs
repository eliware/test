import { runCoreConventionChecks } from '../../src/conventions/run-core-convention-checks.mjs';

test('runs core convention checks', async () => {
  const result = await runCoreConventionChecks({ exceptions: [], read: async () => '', paths: new Set(), files: new Set(), packageJson: {} });
  expect(result).toEqual(expect.any(Array));
});
