import { validateRunnerArguments } from '../../src/application/validate-runner-arguments.mjs';

test('normalizes forwarded arguments and identifies wrapper-owned options', () => {
  expect(validateRunnerArguments(['--', '-t', 'focused']).args).toEqual(['-t', 'focused']);
  expect(validateRunnerArguments(['--coverage=false']).protectedArgument).toBe('--coverage=false');
  expect(validateRunnerArguments(['-t', 'focused']).protectedArgument).toBeUndefined();
});
