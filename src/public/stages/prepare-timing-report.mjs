/** Enable the optional in-memory Jest timing report. */
export function prepareTimingReport(debugTiming) {
  return debugTiming ? true : undefined;
}
