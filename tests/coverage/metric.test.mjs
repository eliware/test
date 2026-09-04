import { metricHasGap } from '../../src/coverage/metric.mjs';

test.each([
  ['100%', false], ['100.000%', false], ['100% (1/1)', false], ['100 % (1/1)', false],
  ['99%', true], ['99.99%', true], ['1 / 1', false], ['0 / 1', true], ['2 / 1', true],
  ['0 / 0', true], ['1 / 2', true], ['100% (1/2)', true], ['100% (0/0)', true],
  ['not coverage', true], [null, true], [0, true]
])('classifies metric %p', (value, gap) => expect(metricHasGap(value)).toBe(gap));

test('rejects malformed or oversized values without coercion', () => {
  expect(metricHasGap('-1')).toBe(true);
  expect(metricHasGap('101')).toBe(true);
  expect(metricHasGap('100.00abc%')).toBe(true);
  expect(metricHasGap(`66.${'6'.repeat(2000)}% (2/3)`)).toBe(true);
  expect(metricHasGap('100% (-1/1)')).toBe(true);
  expect(metricHasGap('100% (1/-1)')).toBe(true);
  expect(metricHasGap(`100% (${'1'.repeat(257)}/${'1'.repeat(257)})`)).toBe(true);
  expect(metricHasGap(`${'1'.repeat(257)}/${'1'.repeat(257)}`)).toBe(true);
});

test('checks annotated percentages against exact counters', () => {
  expect(metricHasGap('80% (4/5)')).toBe(true);
  expect(metricHasGap('99.995% (1/1)')).toBe(false);
  expect(metricHasGap('100.0000% (1/1)')).toBe(false);
  expect(metricHasGap('100% (9007199254740992/9007199254740993)')).toBe(true);
});
