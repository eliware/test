import { DEFAULT_LIMITS, MONOLITH_EXIT_CODE } from '../../src/monolith/constants.mjs';

test('defines the documented defaults and exit code', () => {
  expect(DEFAULT_LIMITS).toEqual({ source: 300, test: 600 });
  expect(MONOLITH_EXIT_CODE).toBe(18);
});
