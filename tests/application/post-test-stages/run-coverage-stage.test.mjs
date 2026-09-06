import { runCoverageStage } from '../../../src/application/post-test-stages/run-coverage-stage.mjs';
import { jest } from '@jest/globals';

test('skips coverage when requested and normalizes invalid results', async () => {
  const validator = jest.fn();
  await expect(runCoverageStage({ ignoreCoverage: true, coverageValidator: validator })).resolves.toBe(0);
  expect(validator).not.toHaveBeenCalled();
  await expect(runCoverageStage({ write: () => {}, testResult: { output: '' }, coverageValidator: async () => ({}) })).resolves.toBe(10);
});
