import { parseJestArguments } from "./parse-jest-arguments.mjs";

const testPathPattern = /^tests[\\/].+\.(?:test|spec)\.(?:js|jsx|ts|tsx|mjs|cjs|mts|cts)$/iu;
const absolutePathPattern = /^(?:[A-Za-z]:[\\/]|\/|\\\\)/u;

export function parseFocusedArguments(args = []) {
  const parsed = parseJestArguments(args);
  return {
    positional: parsed.positional,
    optionValues: parsed.optionValues,
    forwardedTestPaths: parsed.afterSeparator.filter(
      (argument) => testPathPattern.test(argument) || absolutePathPattern.test(argument),
    ),
  };
}

export function focusedPathFrom(args = []) {
  return focusedPathsFrom(args)[0];
}

export function focusedPathsFrom(args = []) {
  return parseFocusedArguments(args).positional.filter((argument) =>
    /^tests(?:[\\/]|$)/iu.test(argument),
  );
}
