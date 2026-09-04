/** Jest options whose following token is a value rather than a test path. */
export const VALUE_OPTIONS = Object.freeze([
  '-t', '--testNamePattern', '--config', '--rootDir', '--testMatch',
  '--testPathPattern', '--selectProjects', '--projects', '--runTestsByPath',
  '--env', '--watchPathIgnorePatterns', '--moduleNameMapper', '--outputFile'
]);

/** Extract positional arguments that identify focused test files. */
export function extractFocusedPaths(argumentsList) {
  if (!Array.isArray(argumentsList)) throw new TypeError('extractFocusedPaths requires an argument array');
  const values = [];
  const valueOptions = new Set(VALUE_OPTIONS);
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (valueOptions.has(argument)) {
      if (index + 1 >= argumentsList.length) throw new Error(`${argument} requires a value.`);
      index += 1;
      continue;
    }
    if (!argument.startsWith('-')) values.push(argument);
  }
  return values.filter(isFocusedTestPath);
}
import { isFocusedTestPath } from './focused-path-matcher.mjs';
export { isFocusedTestPath } from './focused-path-matcher.mjs';
