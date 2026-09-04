import { isManagedOption } from '../../src/arguments/managed-options.mjs';

test.each(['--coverage', '--coverage=false', '--silent=true'])('recognizes %s', (argument) => {
  expect(isManagedOption(argument)).toBe(true);
});

test('does not classify unrelated arguments as managed', () => {
  expect(isManagedOption('--watch')).toBe(false);
  expect(isManagedOption(null)).toBe(false);
});
