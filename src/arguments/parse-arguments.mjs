import { isManagedOption, isWrapperOption, MANAGED_OPTIONS } from './classify-arguments.mjs';

export const HELP_TEXT = `Usage:
  eliware-test                         Run Jest with coverage, then lint
  eliware-test --lint                  Run lint only
  eliware-test --version              Show the package version
  eliware-test --ignore-100x4          Run tests without coverage enforcement
  eliware-test --ignore-monolith-limits Run tests while refactoring large files
  eliware-test --sanitize-env          Run child tools with a minimal environment
  eliware-test --debug-timing          Show elapsed time between pipeline steps
  npm test -- <Jest arguments>         Forward arguments to Jest
  npm test -- --no-runInBand           Allow Jest's default parallel execution
`;

export { MANAGED_OPTIONS };

export function parseArguments(argumentsList = []) {
  if (!Array.isArray(argumentsList)) throw new TypeError('parseArguments requires an argument array');
  const lint = argumentsList.includes('--lint');
  const ignoreCoverage = argumentsList.includes('--ignore-100x4');
  const ignoreMonolithLimits = argumentsList.includes('--ignore-monolith-limits');
  const disableInBand = argumentsList.includes('--no-runInBand');
  const sanitizeEnv = argumentsList.includes('--sanitize-env');
  const debugTiming = argumentsList.includes('--debug-timing');
  const runnerArguments = argumentsList.filter((argument) => !isWrapperOption(argument));
  const protectedArgument = runnerArguments.find(isManagedOption);
  if (protectedArgument) throw new Error(`${protectedArgument} is managed by eliware-test; remove it and use the wrapper command directly.`);
  if (argumentsList.includes('--version') || argumentsList.includes('-v')) return { version: true, lint: false, runnerArguments: [] };
  if (argumentsList.includes('--help') || argumentsList.includes('-h')) return { help: true, lint: false, runnerArguments: [] };
  if (lint && runnerArguments.length > 0) throw new Error('`--lint` cannot be combined with test arguments; run `eliware-test --lint` separately.');
  const parsed = { lint, runnerArguments: runnerArguments[0] === '--' ? runnerArguments.slice(1) : runnerArguments };
  if (disableInBand) parsed.runInBand = false;
  if (ignoreCoverage) parsed.ignoreCoverage = true;
  if (sanitizeEnv) parsed.sanitizeEnv = true;
  if (ignoreMonolithLimits) parsed.ignoreMonolithLimits = true;
  if (debugTiming) parsed.debugTiming = true;
  return parsed;
}
