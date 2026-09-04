/** Jest options whose following token is a value rather than a test path. */
export const VALUE_OPTIONS = Object.freeze([
  '-t', '-e', '-w', '--testNamePattern', '--config', '--rootDir', '--testMatch',
  '--testPathPattern', '--selectProjects', '--projects', '--runTestsByPath',
  '--env', '--watchPathIgnorePatterns', '--moduleNameMapper', '--outputFile',
  '--testPathIgnorePatterns', '--testPathPatterns', '--modulePathIgnorePatterns', '--transform',
  '--transformIgnorePatterns', '--coveragePathIgnorePatterns', '--reporters',
  '--coverageThreshold', '--testEnvironmentOptions', '--resolver', '--preset',
  '--setupFiles', '--setupFilesAfterEnv', '--snapshotResolver', '--testSequencer',
  '--testRegex', '--filter', '--dependencyExtractor', '--globalSetup',
  '--globalTeardown', '--testEnvironment', '--maxWorkers', '--maxConcurrency',
  '--slowTestThreshold', '--bail', '--changedSince', '--findRelatedTests'
]);
function consumesFollowingValue(optionName) {
  return VALUE_OPTIONS.includes(optionName);
}

/** Extract positional arguments that identify focused test files. */
export function extractFocusedPaths(argumentsList) {
  if (!Array.isArray(argumentsList)) throw new TypeError('extractFocusedPaths requires an argument array');
  const values = [];
  const valueOptions = new Set(VALUE_OPTIONS);
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (typeof argument !== 'string') continue;
    const optionName = argument.split('=', 1)[0];
    if (valueOptions.has(optionName) || consumesFollowingValue(optionName)) {
      if (optionName === argument) {
        if (index + 1 >= argumentsList.length) throw new Error(`${argument} requires a value.`);
        if (typeof argumentsList[index + 1] === 'string' && argumentsList[index + 1].startsWith('-')) {
          throw new Error(`${argument} requires a value before ${argumentsList[index + 1]}.`);
        }
        index += 1;
      }
      continue;
    }
    if (!argument.startsWith('-')) values.push(argument);
  }
  return values.filter(isFocusedTestPath);
}
import { isFocusedTestPath } from './focused-path-matcher.mjs';
