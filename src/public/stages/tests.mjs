import { EXIT_CODES } from '../../exit-codes/codes.mjs';
import { handleTimingReport } from './handle-timing-report.mjs';
import { prepareCoverageDirectory } from '../../coverage/run-directory.mjs';
import { runTestProcess } from './run-test-process.mjs';
import { promoteTestCoverage } from './promote-test-coverage.mjs';

/** Orchestrate isolated coverage, Jest execution, promotion, and timing cleanup. */
export async function executeTests({ cwd, args, runInBand, focusedCoverage, focusedPathMode, timingOutput, runTest, runChildProcess, readFilePath, removePath, accessPath, renamePath, write }) {
  const isolatedCoverage = typeof accessPath === 'function' && typeof renamePath === 'function';
  let coverageDirectory;
  try { coverageDirectory = isolatedCoverage ? await prepareCoverageDirectory(cwd, removePath) : undefined; }
  catch (error) { write(`Coverage cleanup failed: ${error.message}\n`); return { code: EXIT_CODES.COVERAGE_CLEANUP }; }
  let result;
  try {
    result = await runTestProcess({ cwd, args, runInBand, focusedCoverage, focusedPathMode, timingOutput, coverageDirectory, runTest, runChildProcess });
  } catch (error) {
    const cleanup = isolatedCoverage ? await promoteTestCoverage(cwd, coverageDirectory, accessPath, removePath, renamePath, write) : undefined;
    if (cleanup) return cleanup;
    write(`Tests failed to start: ${error.message}\n`);
    return { code: EXIT_CODES.TEST_START };
  }
  if (result.code !== 0) {
    await handleTimingReport({ cwd, timingOutput, readFilePath, removePath, write });
    return result;
  }
  const cleanup = isolatedCoverage ? await promoteTestCoverage(cwd, coverageDirectory, accessPath, removePath, renamePath, write) : undefined;
  if (cleanup) return cleanup;
  await handleTimingReport({ cwd, timingOutput, readFilePath, removePath, write });
  return result;
}
