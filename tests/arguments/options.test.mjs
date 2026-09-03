import { HELP_TEXT, MANAGED_OPTIONS, VALUE_OPTIONS } from '../../src/arguments/options.mjs';

test('defines wrapper option metadata and help', () => {
  expect(MANAGED_OPTIONS).toContain('--coverage');
  expect(VALUE_OPTIONS).toContain('-t');
  expect(HELP_TEXT).toContain('eliware-test');
});
test.todo('implement options unit tests');
