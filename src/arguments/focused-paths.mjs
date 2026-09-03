/** Jest options whose following token is a value rather than a test path. */
export const VALUE_OPTIONS = Object.freeze([
  '-t', '--testNamePattern', '--config', '--rootDir', '--testMatch',
  '--testPathPattern', '--selectProjects', '--projects', '--runTestsByPath',
  '--env', '--watchPathIgnorePatterns', '--moduleNameMapper', '--outputFile'
]);

/** Return whether an argument is a concrete test file path. */
export function isFocusedTestPath(argument) {
  return typeof argument === 'string' && !argument.startsWith('-') && !/[*!?[\]{}]/.test(argument)
    && /(?:\.(?:c|m)?js|jsx|tsx|cts|mts|ts)$/i.test(argument)
    && /(?:^|[\\/])(?:tests?|spec)(?:[\\/]|$)/i.test(argument);
}

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
