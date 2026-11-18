import parseJestArguments from "./jest-arguments.mjs";
const testPathPattern = /^tests[\\/].+\.(?:test|spec)\.(?:js|jsx|ts|tsx|mjs|cjs|mts|cts)$/iu;
const absolutePathPattern = /^(?:[A-Za-z]:[\\/]|\/|\\\\)/u;
export default function parseFocusedArguments(args = []) {
  const parsed = parseJestArguments(args);
  return {
    positional: parsed.positional,
    optionValues: parsed.optionValues,
    forwardedTestPaths: parsed.afterSeparator.filter(
      (argument) => testPathPattern.test(argument) || absolutePathPattern.test(argument),
    ),
  };
}
