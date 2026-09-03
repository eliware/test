import { isManagedArgument, isWrapperArgument } from './classification.mjs';
import { HELP_TEXT, MANAGED_OPTIONS, VALUE_OPTIONS } from './options.mjs';

export { HELP_TEXT, MANAGED_OPTIONS, VALUE_OPTIONS };

export function parseArguments(argumentsList = []) {
  const lint = argumentsList.includes('--lint');
  const ignoreCoverage = argumentsList.includes('--ignore-100x4');
  const ignoreMonolithLimits = argumentsList.includes('--ignore-monolith-limits');
  const disableInBand = argumentsList.includes('--no-runInBand');
  const sanitizeEnv = argumentsList.includes('--sanitize-env');
  const runnerArguments = argumentsList.filter((argument) => !isWrapperArgument(argument));
  const protectedArgument = runnerArguments.find((argument) => isManagedArgument(argument, MANAGED_OPTIONS));
  if (protectedArgument) throw new Error(`${protectedArgument} is managed by eliware-test; remove it and use the wrapper command directly.`);
  if (argumentsList.includes('--version') || argumentsList.includes('-v')) return { version: true, lint: false, runnerArguments: [] };
  if (argumentsList.includes('--help') || argumentsList.includes('-h')) return { help: true, lint: false, runnerArguments: [] };
  if (lint && runnerArguments.length > 0) throw new Error('`--lint` cannot be combined with test arguments; run `eliware-test --lint` separately.');
  const parsed = { lint, runnerArguments: runnerArguments[0] === '--' ? runnerArguments.slice(1) : runnerArguments };
  if (disableInBand) parsed.runInBand = false;
  if (ignoreCoverage) parsed.ignoreCoverage = true;
  if (sanitizeEnv) parsed.sanitizeEnv = true;
  if (ignoreMonolithLimits) parsed.ignoreMonolithLimits = true;
  return parsed;
}
