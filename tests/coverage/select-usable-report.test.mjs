import { hasUsableReport, selectUsableReport } from '../../src/coverage/select-usable-report.mjs';

test('requires a candidate list', () => {
  expect(() => selectUsableReport(null)).toThrow(TypeError);
});

test('selects the first usable candidate', () => {
  const candidate = { usable: true, report: { name: 'current' } };
  expect(selectUsableReport([null, { usable: false }, candidate, { usable: true }])).toBe(candidate);
});

test('returns null when no candidate is usable', () => {
  expect(selectUsableReport()).toBeNull();
  expect(selectUsableReport([null, {}, { usable: false }])).toBeNull();
});

test('identifies usable reports', () => {
  expect(hasUsableReport({ usable: true })).toBe(true);
  expect(hasUsableReport({ usable: false })).toBe(false);
  expect(hasUsableReport(null)).toBe(false);
});
