import { classifyArgument, isManagedOption, isWrapperOption } from '../../src/arguments/classify-arguments.mjs';

test('classifies managed and wrapper arguments', () => {
  expect(isManagedOption('--coverage=false')).toBe(true);
  expect(isManagedOption('--watch')).toBe(false);
  expect(isWrapperOption('--lint')).toBe(true);
  expect(isWrapperOption('--watch')).toBe(false);
});

test('returns the complete argument classification', () => {
  expect(classifyArgument('--lint')).toBe('wrapper');
  expect(classifyArgument('--coverage')).toBe('managed');
  expect(classifyArgument('-t')).toBe('forwarded');
});
