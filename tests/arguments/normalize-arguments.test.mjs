import { normalizeArguments } from '../../src/arguments/normalize-arguments.mjs';

test('removes wrapper options and a separator', () => {
  expect(normalizeArguments(['--lint', '--', '--watch'])).toEqual(['--watch']);
});

test('rejects malformed input and defaults to no arguments', () => {
  expect(() => normalizeArguments(null)).toThrow(TypeError);
  expect(normalizeArguments()).toEqual([]);
});
