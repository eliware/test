export function readWrapperOptions(argumentsList) {
  return {
    lint: argumentsList.includes('--lint'),
    ignoreCoverage: argumentsList.includes('--ignore-100x4'),
    ignoreMonolithLimits: argumentsList.includes('--ignore-monolith-limits'),
    disableInBand: argumentsList.includes('--no-runInBand'),
    debugTiming: argumentsList.includes('--debug-timing')
  };
}
