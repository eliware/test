import { handleTimingReport } from './handle-timing-report.mjs';
import { EXIT_CODES } from '../../exit-codes/codes.mjs';
import { runTestProcess } from './run-test-process.mjs';

/** Orchestrate normal Jest coverage output and timing reporting. */
export async function executeTests({ cwd, args, runInBand, focusedCoverage, focusedPathMode, timingOutput, runTest, runChildProcess, write }) {
  let result;
  try {
    result = await runTestProcess({ cwd, args, runInBand, focusedCoverage, focusedPathMode, timingOutput, runTest, runChildProcess });
  } catch (error) {
    write(`Tests failed to start: ${error.message}\n`);
    return { code: EXIT_CODES.TEST_START };
  }
  if (result.code !== 0) {
    if (timingOutput) handleTimingReport({ timingOutput: result.timingOutput ?? result.output, write });
    return result;
  }
  if (timingOutput) handleTimingReport({ timingOutput: result.timingOutput ?? result.output, write });
  return result;
}
