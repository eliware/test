import { prepareTestSelection } from './prepare-test-selection.mjs';
import { prepareTimingReport } from './prepare-timing-report.mjs';

export async function prepareTests({ cwd, args, accessPath, debugTiming }) {
  const selection = await prepareTestSelection(cwd, args, accessPath);
  if (selection.missing) return selection;
  return { ...selection, timingOutput: prepareTimingReport(debugTiming) };
}
