import { normalizeStageResult, stageSucceeded } from '../../../src/application/pipeline/stage-result.mjs';

test('normalizes missing stage results as failures', () => {
  expect(normalizeStageResult(undefined)).toEqual({ code: 1, output: '' });
  expect(stageSucceeded({ code: 0, output: '' })).toBe(true);
  expect(stageSucceeded({ code: 1 })).toBe(false);
});
