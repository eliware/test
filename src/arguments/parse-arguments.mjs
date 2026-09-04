import { isManagedOption, isWrapperOption, MANAGED_OPTIONS } from './classify-arguments.mjs';
import { terminalMode } from './command-modes.mjs';
import { readWrapperOptions } from './wrapper-options.mjs';
import { assertCompatibleArguments } from './validate-options.mjs';
export { HELP_TEXT } from './help-text.mjs';

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
