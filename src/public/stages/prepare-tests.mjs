import { prepareTestSelection } from './prepare-test-selection.mjs';
import { prepareTimingReport } from './prepare-timing-report.mjs';

export async function prepareTests({ cwd, args, accessPath, removePath, debugTiming }) {
  const selection = await prepareTestSelection(cwd, args, accessPath);
  if (selection.missing) return selection;
  const timing = await prepareTimingReport(cwd, debugTiming, removePath);
  if (timing?.cleanupError) return { cleanupError: timing.cleanupError };
  return { ...selection, timingOutput: timing };
}
