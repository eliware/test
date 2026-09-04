export function readWrapperOptions(argumentsList) {
  const workersArgument = argumentsList.find((argument) => typeof argument === 'string' && argument.startsWith('--workers='));
  const workers = workersArgument === undefined ? undefined : Number(workersArgument.slice('--workers='.length));
  if (workers !== undefined && (!Number.isInteger(workers) || workers <= 0)) throw new Error('--workers must be a positive integer.');
  return {
    lint: argumentsList.includes('--lint'),
    ignoreCoverage: argumentsList.includes('--ignore-100x4'),
    ignoreMonolithLimits: argumentsList.includes('--ignore-monolith-limits'),
    disableInBand: argumentsList.includes('--no-runInBand'),
    debugTiming: argumentsList.includes('--debug-timing'),
    workers
  };
}

export function hasEqualsFormWrapperOption(argumentsList) {
  return argumentsList.some((argument) => typeof argument === 'string' && ['--lint', '--ignore-100x4', '--ignore-monolith-limits', '--runInBand', '--no-runInBand', '--debug-timing'].some((option) => argument.startsWith(`${option}=`)));
}
