import { EXIT_CODES } from '../../src/exit-codes/codes.mjs';

test('defines stable unique wrapper exit codes', () => {
  expect(EXIT_CODES.TEST_FAILURE).toBe(9);
  expect(EXIT_CODES.MONOLITH_LIMIT).toBe(18);
  expect(new Set(Object.values(EXIT_CODES)).size).toBe(Object.keys(EXIT_CODES).length);
});
