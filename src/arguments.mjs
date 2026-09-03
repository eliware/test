export const HELP_TEXT = `Usage:
  eliware-test                         Run Jest with coverage, then lint
  eliware-test --lint                  Run lint only
  eliware-test --version              Show the package version
  eliware-test --ignore-100x4          Run tests without coverage enforcement
  eliware-test --sanitize-env          Run child tools with a minimal environment
  npm test -- <Jest arguments>         Forward arguments to Jest
  npm test -- --no-runInBand           Allow Jest's default parallel execution

Examples:
  npm test -- tests/foo.test.mjs
  npm test -- -t "focused test name"
  npx eliware-test -- tests/foo.test.mjs
  .\\node_modules\\.bin\\eliware-test.cmd -- tests/foo.test.mjs
`;

export const MANAGED_OPTIONS = Object.freeze(['--coverage', '--detectOpenHandles', '--silent', '--coverageReporters', '--runTestsByPath']);
export const VALUE_OPTIONS = Object.freeze(['-t', '--testNamePattern', '--config', '--rootDir', '--testMatch', '--testPathPattern', '--selectProjects', '--projects', '--runTestsByPath', '--env', '--watchPathIgnorePatterns', '--moduleNameMapper', '--outputFile']);

export function parseArguments(argumentsList = []) {
  const lint = argumentsList.includes('--lint');
  const ignoreCoverage = argumentsList.includes('--ignore-100x4');
  const disableInBand = argumentsList.includes('--no-runInBand');
  const sanitizeEnv = argumentsList.includes('--sanitize-env');
  const runnerArguments = argumentsList.filter((argument) => !['--lint', '--ignore-100x4', '--runInBand', '--no-runInBand', '--sanitize-env'].includes(argument));
  const protectedArgument = runnerArguments.find((argument) => MANAGED_OPTIONS.some((name) => argument === name || argument.startsWith(`${name}=`)));
  if (protectedArgument) throw new Error(`${protectedArgument} is managed by eliware-test; remove it and use the wrapper command directly.`);
  if (argumentsList.includes('--version') || argumentsList.includes('-v')) return { version: true, lint: false, runnerArguments: [] };
  if (argumentsList.includes('--help') || argumentsList.includes('-h')) return { help: true, lint: false, runnerArguments: [] };
  if (lint && runnerArguments.length > 0) {
    throw new Error('`--lint` cannot be combined with test arguments; run `eliware-test --lint` separately.');
  }
  const parsed = { lint, runnerArguments: runnerArguments[0] === '--' ? runnerArguments.slice(1) : runnerArguments };
  if (disableInBand) parsed.runInBand = false;
  if (ignoreCoverage) parsed.ignoreCoverage = true;
  if (sanitizeEnv) parsed.sanitizeEnv = true;
  return parsed;
}
