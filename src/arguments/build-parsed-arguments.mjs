/** Build the normalized runner options from parsed wrapper state. */
export function buildParsedArguments(runnerArguments, options) {
  const parsed = { lint: options.lint, runnerArguments: runnerArguments[0] === '--' ? runnerArguments.slice(1) : runnerArguments };
  if (options.disableInBand) parsed.runInBand = false;
  if (options.ignoreCoverage) parsed.ignoreCoverage = true;
  if (options.ignoreMonolithLimits) parsed.ignoreMonolithLimits = true;
  if (options.debugTiming) parsed.debugTiming = true;
  return parsed;
}
