import { validateRunnerArguments } from '../../src/application/validate-runner-arguments.mjs';

test('normalizes forwarded arguments and identifies wrapper-owned options', () => {
  expect(validateRunnerArguments(['--', '-t', 'focused']).args).toEqual(['-t', 'focused']);
  expect(validateRunnerArguments(['--coverage=false']).protectedArgument).toBe('--coverage=false');
  expect(validateRunnerArguments(['-t', 'focused']).protectedArgument).toBeUndefined();
});

test.each(['--coverage', '--detectOpenHandles', '--silent', '--coverageReporters', '--runTestsByPath'])('protects bare and equals-form %s', (option) => {
  expect(validateRunnerArguments([option]).protectedArgument).toBe(option);
  expect(validateRunnerArguments([`${option}=value`]).protectedArgument).toBe(`${option}=value`);
});

test('only protects managed options and preserves argument order', () => {
  expect(validateRunnerArguments(['tests/a.test.mjs', '--', '--coverage=false']).args)
    .toEqual(['tests/a.test.mjs', '--coverage=false']);
  expect(validateRunnerArguments(['--coverageReporters', 'text']).protectedArgument).toBe('--coverageReporters');
});
