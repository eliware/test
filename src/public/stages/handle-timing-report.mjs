import { resolve } from 'node:path';
import { formatTestTimings } from '../../diagnostics/format-test-timings.mjs';

/** Emit and remove Jest's optional timing report. */
export async function handleTimingReport({ cwd, timingOutput, readFilePath, removePath, write }) {
  if (!timingOutput) return null;
  try { write(formatTestTimings(JSON.parse(await readFilePath(timingOutput, 'utf8')))); }
  catch (error) { write(`Timing report unavailable: ${error.message}\n`); }
  try { await removePath(resolve(cwd, '.eliware-test-timings.json'), { force: true }); }
  catch (error) { write(`Timing report cleanup unavailable: ${error.message}\n`); }
  return null;
}
