import { jest } from '@jest/globals';
import { prepareTimingReport } from '../../../src/public/stages/prepare-timing-report.mjs';

test('does nothing when timing is disabled', async () => {
  const removePath = jest.fn();
  await expect(prepareTimingReport('repo', false, removePath)).resolves.toBeUndefined();
  expect(removePath).not.toHaveBeenCalled();
});

test('removes stale timing output', async () => {
  const removePath = jest.fn(async () => {});
  await expect(prepareTimingReport('repo', true, removePath)).resolves.toContain('.eliware-test-timings.json');
  expect(removePath).toHaveBeenCalled();
});
