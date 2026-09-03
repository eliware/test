import { isManagedArgument, isWrapperArgument } from '../../src/arguments/classification.mjs';

test('classifies managed and wrapper arguments', () => {
  expect(isManagedArgument('--coverage=false', ['--coverage'])).toBe(true);
  expect(isManagedArgument('--watch', ['--coverage'])).toBe(false);
  expect(isWrapperArgument('--lint')).toBe(true);
  expect(isWrapperArgument('--watch')).toBe(false);
});
test.todo('implement classification unit tests');
