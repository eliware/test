import { buildParsedArguments } from '../../src/arguments/build-parsed-arguments.mjs';

test('builds normalized runner options', () => {
  expect(buildParsedArguments(['--', 'tests/a.test.mjs'], {
    lint: false, disableInBand: true, ignoreCoverage: true, ignoreMonolithLimits: false, debugTiming: true,
  })).toEqual({ lint: false, runnerArguments: ['tests/a.test.mjs'], runInBand: false, ignoreCoverage: true, debugTiming: true });
});
