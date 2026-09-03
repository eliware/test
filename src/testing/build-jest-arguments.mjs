/** Build the managed Jest arguments before appending user-selected filters. */
export function buildJestArguments({ runnerArguments = [], runInBand = true, focusedCoverage = [], focusedPathMode = false, timingOutput } = {}) {
  if (!Array.isArray(runnerArguments)) throw new TypeError('buildJestArguments runnerArguments must be an array');
  if (!Array.isArray(focusedCoverage)) throw new TypeError('buildJestArguments focusedCoverage must be an array');
  const executionArguments = [
    '--coverage',
    ...(runInBand ? ['--runInBand'] : []),
    '--detectOpenHandles',
    '--silent',
    '--coverageReporters=text',
    '--coverageReporters=json',
    ...focusedCoverage,
    ...(focusedPathMode ? ['--runTestsByPath'] : []),
    ...(typeof timingOutput === 'string' ? ['--json', `--outputFile=${timingOutput}`] : []),
    ...runnerArguments
  ];
  return executionArguments;
}
