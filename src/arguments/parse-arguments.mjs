import { isManagedOption, isWrapperOption, MANAGED_OPTIONS } from './classify-arguments.mjs';
import { terminalMode } from './command-modes.mjs';
import { readWrapperOptions } from './wrapper-options.mjs';
import { assertCompatibleArguments } from './validate-options.mjs';

export const HELP_TEXT = `Usage:
  eliware-test                         Run Jest with coverage, then lint
  eliware-test --lint                  Run lint only
  eliware-test --version              Show the package version
  eliware-test --ignore-100x4          Run tests without coverage enforcement
  eliware-test --ignore-monolith-limits Run tests while refactoring large files
  eliware-test --debug-timing          Show elapsed time between pipeline steps
  npm test -- <Jest arguments>         Forward arguments to Jest
  npm test -- --no-runInBand           Allow Jest's default parallel execution
`;

export { MANAGED_OPTIONS };

export function parseArguments(argumentsList = []) {
  if (!Array.isArray(argumentsList)) throw new TypeError('parseArguments requires an argument array');
  const { lint, ignoreCoverage, ignoreMonolithLimits, disableInBand, debugTiming } = readWrapperOptions(argumentsList);
  const runnerArguments = argumentsList.filter((argument) => !isWrapperOption(argument));
  const protectedArgument = runnerArguments.find(isManagedOption);
  if (protectedArgument) throw new Error(`${protectedArgument} is managed by eliware-test; remove it and use the wrapper command directly.`);
  const mode = terminalMode(argumentsList);
  if (mode) return mode;
  assertCompatibleArguments(lint, runnerArguments);
  const parsed = { lint, runnerArguments: runnerArguments[0] === '--' ? runnerArguments.slice(1) : runnerArguments };
  if (disableInBand) parsed.runInBand = false;
  if (ignoreCoverage) parsed.ignoreCoverage = true;
  if (ignoreMonolithLimits) parsed.ignoreMonolithLimits = true;
  if (debugTiming) parsed.debugTiming = true;
  return parsed;
}
