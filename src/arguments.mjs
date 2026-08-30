export const HELP_TEXT = `Usage:
  eliware-test                         Run Jest with coverage, then lint
  eliware-test --lint                  Run lint only
  eliware-test --version              Show the package version
  eliware-test --ignore-100x4          Run tests without coverage enforcement
  npm test -- <Jest arguments>         Forward arguments to Jest

Examples:
  npm test -- tests/foo.test.mjs
  npm test -- --runInBand
  npx eliware-test -- tests/foo.test.mjs
  .\\node_modules\\.bin\\eliware-test.cmd -- tests/foo.test.mjs
`;

export function parseArguments(argumentsList = []) {
  if (argumentsList.includes('--version') || argumentsList.includes('-v')) {
    return { version: true, lint: false, runnerArguments: [] };
  }
  if (argumentsList.includes('--help') || argumentsList.includes('-h')) {
    return { help: true, lint: false, runnerArguments: [] };
  }
  const lint = argumentsList.includes('--lint');
  const ignoreCoverage = argumentsList.includes('--ignore-100x4');
  const runnerArguments = argumentsList.filter((argument) => !['--lint', '--ignore-100x4'].includes(argument));
  if (lint && runnerArguments.length > 0) {
    throw new Error('`--lint` cannot be combined with test arguments; run `eliware-test --lint` separately.');
  }
  const parsed = { lint, runnerArguments: runnerArguments[0] === '--' ? runnerArguments.slice(1) : runnerArguments };
  if (ignoreCoverage) parsed.ignoreCoverage = true;
  return parsed;
}
