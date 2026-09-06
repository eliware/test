import { selectFailureCode } from '../../../src/application/post-test-stages/select-failure-code.mjs';

test('returns the highest positive integer failure or null', () => {
  expect(selectFailureCode(0, null, 13, 10)).toBe(13);
  expect(selectFailureCode(0, null, '13')).toBeNull();
});
