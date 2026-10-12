import { parseFocusedArguments } from "./parse-focused-arguments.mjs";

const focusedTestPathPattern = /^tests[\\/].*\.(?:test|spec)\.(?:js|jsx|ts|tsx|mjs|cjs|mts|cts)$/iu;

export function resolveFocusedTestPaths(args, hasToolMode) {
  const parsed = parseFocusedArguments(args);
  if (parsed.forwardedTestPaths.length > 0) {
    throw new Error(
      hasToolMode
        ? "Focused test paths cannot be combined with tool modes."
        : "Focused test paths must be supplied before the -- separator.",
    );
  }
  if (hasToolMode && parsed.positional.some((argument) => focusedTestPathPattern.test(argument))) {
    throw new Error("Focused test paths cannot be combined with tool modes.");
  }
  const focused = hasToolMode ? [] : parsed.positional;
  if (focused.some((argument) => !focusedTestPathPattern.test(argument))) {
    throw new Error("Focused paths must be under tests/.");
  }
  if (focused.some((argument) => !hasFocusedSourceName(argument)))
    throw new Error("Focused test paths must have a source module name.");
  return focused;
}

function hasFocusedSourceName(path) {
  const fileName = path.split(/[\\/]/u).at(-1);
  const suffixIndex = fileName.search(/\.(?:test|spec)\./u);
  return suffixIndex >= 0 && /[^.]/u.test(fileName.slice(0, suffixIndex));
}
