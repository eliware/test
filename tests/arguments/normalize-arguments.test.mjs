import { normalizeArguments } from '../../src/arguments/normalize-arguments.mjs';

test('removes wrapper options and a separator', () => {
  expect(normalizeArguments(['--lint', '--', '--watch'])).toEqual(['--watch']);
});
