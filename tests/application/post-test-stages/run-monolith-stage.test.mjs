import { runMonolithStage } from '../../../src/application/post-test-stages/run-monolith-stage.mjs';
import { jest } from '@jest/globals';

test('skips disabled monolith validation and delegates enabled validation', async () => {
  const findMonolith = jest.fn(async () => []);
  await expect(runMonolithStage({ cwd: '.', write: () => {}, enforceMonolithLimits: false, findMonolith })).resolves.toBe(0);
  expect(findMonolith).not.toHaveBeenCalled();
  await expect(runMonolithStage({ cwd: '.', write: () => {}, enforceMonolithLimits: true, findMonolith })).resolves.toBe(0);
  expect(findMonolith).toHaveBeenCalled();
});
