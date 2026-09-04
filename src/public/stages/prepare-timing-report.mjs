import { resolve } from 'node:path';

/** Prepare the optional Jest timing-report path and remove stale output. */
export async function prepareTimingReport(cwd, debugTiming, removePath) {
  if (!debugTiming) return undefined;
  const timingOutput = resolve(cwd, '.eliware-test-timings.json');
  try { await removePath(timingOutput, { force: true }); }
  catch (error) { return { timingOutput, cleanupError: error }; }
  return timingOutput;
}
