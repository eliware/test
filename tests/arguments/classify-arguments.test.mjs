import { classifyArgument, isWrapperOption } from '../../src/arguments/classify-arguments.mjs';

test('classifies managed and wrapper arguments', () => {
  expect(isWrapperOption('--lint')).toBe(true);
});

test('returns the complete argument classification', () => {
  expect(classifyArgument('--lint')).toBe('wrapper');
  expect(classifyArgument('--coverage')).toBe('managed');
  expect(classifyArgument('-t')).toBe('forwarded');
});
