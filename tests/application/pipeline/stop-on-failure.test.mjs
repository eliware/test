import { stopOnFailure } from '../../../src/application/pipeline/stop-on-failure.mjs';

test('stops on numeric and object failures', () => {
  expect(stopOnFailure(0)).toBe(false);
  expect(stopOnFailure(3)).toBe(true);
  expect(stopOnFailure({ code: 1 })).toBe(true);
});
