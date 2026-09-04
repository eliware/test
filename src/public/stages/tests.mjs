import { buildJestArguments } from '../../testing/build-jest-arguments.mjs';
import { EXIT_CODES } from '../../exit-codes/codes.mjs';
import { handleTimingReport } from './handle-timing-report.mjs';
import { normalizeTestResult } from './normalize-test-result.mjs';
export async function executeTests({ cwd, args, runInBand, focusedCoverage, focusedPathMode, timingOutput, runTest, readFilePath, removePath, write }) {
  let test;
  try { test = await runTest(buildJestArguments({ runnerArguments: args, runInBand, focusedCoverage, focusedPathMode, timingOutput }), { cwd, runInBand }); }
  catch (error) { write(`Tests failed to start: ${error.message}\n`); return { code: EXIT_CODES.TEST_START }; }
  const result = normalizeTestResult(test);
  const timingError = await handleTimingReport({ cwd, timingOutput, readFilePath, removePath, write });
  if (timingError) return timingError;
  return result;
}
