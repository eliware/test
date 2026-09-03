import { buildOxlintArguments, runOxlint } from '../../../src/validation/lint/run-oxlint.mjs';

test('builds the managed Oxlint invocation', () => {
  expect(buildOxlintArguments()).toEqual(expect.arrayContaining(['oxlint', '--deny-warnings', '.']));
  expect(buildOxlintArguments()).toContain('--ignore-pattern');
});

test('exports the Oxlint executor', () => {
  expect(runOxlint).toBeInstanceOf(Function);
});
