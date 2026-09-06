import { prepareTimingReport } from '../../../src/public/stages/prepare-timing-report.mjs';

test('does nothing when timing is disabled', () => {
  expect(prepareTimingReport(false)).toBeUndefined();
});

test('enables in-memory timing output', () => {
  expect(prepareTimingReport(true)).toBe(true);
});
