import { parseArguments } from '../../src/arguments/parse-arguments.mjs';

describe('parseArguments', () => {
  test('uses defaults and supports timing', () => {
    expect(parseArguments()).toEqual({ lint: false, runnerArguments: [] });
    expect(parseArguments(['--debug-timing'])).toEqual({ lint: false, debugTiming: true, runnerArguments: [] });
    expect(() => parseArguments(null)).toThrow(TypeError);
  });
  test('parses wrapper options and forwards Jest arguments', () => {
    expect(parseArguments(['--ignore-100x4', '--ignore-monolith-limits', 'tests/a.test.mjs'])).toMatchObject({ ignoreCoverage: true, ignoreMonolithLimits: true, runnerArguments: ['tests/a.test.mjs'] });
    expect(parseArguments(['--', '-t', 'focused']).runnerArguments).toEqual(['-t', 'focused']);
    expect(parseArguments(['--no-runInBand'])).toMatchObject({ runInBand: false });
  });
  test('rejects invalid combinations', () => {
    expect(() => parseArguments(['--lint', 'tests/a.test.mjs'])).toThrow('cannot be combined');
    expect(() => parseArguments(['--coverage=false'])).toThrow('managed by eliware-test');
  });
});
