import { parseArguments, HELP_TEXT } from '../../src/arguments/parse-arguments.mjs';

test('parses the default test command and forwards Jest arguments', () => {
  expect(parseArguments(['--', '-t', 'focused'])).toEqual({
    lint: false,
    runnerArguments: ['-t', 'focused']
  });
});

test('detects standalone lint mode', () => {
  expect(parseArguments(['--lint'])).toEqual({ lint: true, runnerArguments: [] });
});

test('recognizes help and version aliases', () => {
  expect(parseArguments(['--help'])).toMatchObject({ help: true });
  expect(parseArguments(['-h'])).toMatchObject({ help: true });
  expect(parseArguments(['--version'])).toMatchObject({ version: true });
  expect(parseArguments(['-v'])).toMatchObject({ version: true });
});

test('recognizes lint and explicit coverage opt-out options', () => {
  expect(parseArguments(['--lint', '--ignore-100x4'])).toEqual({
    lint: true,
    ignoreCoverage: true,
    runnerArguments: []
  });
});

test('parses the remaining wrapper options', () => {
  expect(parseArguments(['--ignore-monolith-limits'])).toMatchObject({ ignoreMonolithLimits: true });
  expect(parseArguments(['--sanitize-env'])).toMatchObject({ sanitizeEnv: true });
  expect(parseArguments(['--no-runInBand'])).toMatchObject({ runInBand: false });
});

test('rejects lint combined with Jest arguments', () => {
  expect(() => parseArguments(['--lint', 'tests/example.test.mjs'])).toThrow('cannot be combined');
});

test('rejects wrapper-managed Jest options', () => {
  expect(() => parseArguments(['--coverage=false'])).toThrow('managed by eliware-test');
  expect(() => parseArguments(['--help', '--silent'])).toThrow('managed by eliware-test');
});

test('provides non-empty help text', () => {
  expect(HELP_TEXT).toEqual(expect.stringContaining('eliware-test'));
});
