import { passing } from '../src/passing.mjs';

test('passes through the real CLI fixture', () => {
  expect(passing()).toBe(true);
});
