import { isWrapperOption } from './classify-arguments.mjs';
import { terminalMode } from './command-modes.mjs';
import { readWrapperOptions } from './wrapper-options.mjs';
import { assertCompatibleArguments } from './validate-options.mjs';
import { rejectManagedArguments } from './reject-managed-arguments.mjs';
import { buildParsedArguments } from './build-parsed-arguments.mjs';
export function parseArguments(argumentsList = []) {
  if (!Array.isArray(argumentsList)) throw new TypeError('parseArguments requires an argument array');
  const { lint, ignoreCoverage, ignoreMonolithLimits, disableInBand, debugTiming } = readWrapperOptions(argumentsList);
  const runnerArguments = argumentsList.filter((argument) => !isWrapperOption(argument));
  rejectManagedArguments(runnerArguments);
  const mode = terminalMode(argumentsList);
  if (mode) return mode;
  assertCompatibleArguments(lint, runnerArguments);
  return buildParsedArguments(runnerArguments, { lint, disableInBand, ignoreCoverage, ignoreMonolithLimits, debugTiming });
}
