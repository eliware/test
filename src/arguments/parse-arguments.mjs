import { isWrapperOption } from './classify-arguments.mjs';
import { terminalMode } from './command-modes.mjs';
import { hasEqualsFormWrapperOption, readWrapperOptions } from './wrapper-options.mjs';
import { assertCompatibleArguments } from './validate-options.mjs';
import { rejectManagedArguments } from './reject-managed-arguments.mjs';
import { buildParsedArguments } from './build-parsed-arguments.mjs';
export function parseArguments(argumentsList = []) {
  if (!Array.isArray(argumentsList)) throw new TypeError('parseArguments requires an argument array');
  if (argumentsList.some((argument) => typeof argument === 'string' && (argument.startsWith('--help=') || argument.startsWith('--version=')))) {
    throw new Error('Terminal options do not accept equals-form values.');
  }
  if (hasEqualsFormWrapperOption(argumentsList)) {
    throw new Error('Wrapper options do not accept equals-form values.');
  }
  const { lint, ignoreCoverage, ignoreMonolithLimits, disableInBand, debugTiming, workers } = readWrapperOptions(argumentsList);
  const runnerArguments = argumentsList.filter((argument) => !isWrapperOption(argument));
  const mode = terminalMode(argumentsList);
  if (mode) return mode;
  rejectManagedArguments(runnerArguments);
  assertCompatibleArguments(lint, runnerArguments);
  return buildParsedArguments(runnerArguments, { lint, disableInBand, ignoreCoverage, ignoreMonolithLimits, debugTiming, workers });
}
