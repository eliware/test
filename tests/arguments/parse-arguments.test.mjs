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
    expect(parseArguments(['--workers=3'])).toMatchObject({ workers: 3, runnerArguments: [] });
  });
  test('rejects invalid combinations', () => {
    expect(() => parseArguments(['--lint', 'tests/a.test.mjs'])).toThrow('cannot be combined');
    expect(() => parseArguments(['--coverage=false'])).toThrow('managed by eliware-test');
    expect(() => parseArguments(['--ignore-100x4=true'])).toThrow('equals-form');
    expect(() => parseArguments(['--debug-timing=true'])).toThrow('equals-form');
    expect(() => parseArguments(['--lint=false'])).toThrow('equals-form');
    expect(() => parseArguments(['--runInBand=false'])).toThrow('equals-form');
    expect(() => parseArguments(['--no-runInBand=true'])).toThrow('equals-form');
    expect(() => parseArguments(['--help=true'])).toThrow('equals-form');
    expect(() => parseArguments(['--version=false'])).toThrow('equals-form');
    expect(() => parseArguments(['--help=yes'])).toThrow('equals-form');
    expect(() => parseArguments(['--version=1'])).toThrow('equals-form');
    expect(() => parseArguments(['--workers=0'])).toThrow('positive integer');
    expect(() => parseArguments(['--workers=abc'])).toThrow('positive integer');
  });
  test('terminal modes take precedence over managed options', () => {
    expect(parseArguments(['--help', '--coverage'])).toMatchObject({ help: true });
    expect(parseArguments(['--version', '--coverage'])).toMatchObject({ version: true });
  });
});
