import { HELP_TEXT } from '../../src/arguments/help-text.mjs';
test('documents supported commands and diagnostic coverage behavior', () => {
  expect(HELP_TEXT).toContain('eliware-test --lint');
  expect(HELP_TEXT).toContain('--ignore-100x4');
  expect(HELP_TEXT).toContain('with coverage, skip enforcement, then lint');
});
