import { jest } from '@jest/globals';
import { createTiming } from '../../src/diagnostics/timing.mjs';

test('does not write diagnostics when timing is disabled', () => {
  const write = jest.fn();
  const timer = createTiming(false, write, () => 1000);

  timer.step('tests', 'lint');

  expect(write).not.toHaveBeenCalled();
});

test('reports total and step elapsed time when enabled', () => {
  const write = jest.fn();
  const times = [1000, 2500, 4000];
  const timer = createTiming(true, write, () => times.shift());

  timer.step('tests', 'lint');
  timer.step('lint', 'pack');

  expect(write.mock.calls).toEqual([
    ['tests completed, starting lint... (+1.500s total, +1.500s since last step)\n'],
    ['lint completed, starting pack... (+3.000s total, +1.500s since last step)\n']
  ]);
});

test('uses the default performance clock', () => {
  expect(() => createTiming(false, () => {}).step('done', 'next')).not.toThrow();
});
