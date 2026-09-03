import { MANAGED_OPTIONS, isManagedOption } from '../../src/arguments/managed-options.mjs';

test('defines the wrapper-managed Jest options', () => {
  expect(MANAGED_OPTIONS).toContain('--coverage');
  expect(MANAGED_OPTIONS).toContain('--runTestsByPath');
});

test.each(['--coverage', '--coverage=false', '--silent=true'])('recognizes %s', (argument) => {
  expect(isManagedOption(argument)).toBe(true);
});

test('does not classify unrelated arguments as managed', () => {
  expect(isManagedOption('--watch')).toBe(false);
  expect(isManagedOption(null)).toBe(false);
});
