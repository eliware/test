import { buildJestArguments } from '../../testing/build-jest-arguments.mjs';
import { EXIT_CODES } from '../../exit-codes/codes.mjs';
import { handleTimingReport } from './handle-timing-report.mjs';
import { normalizeTestResult } from './normalize-test-result.mjs';
import { prepareCoverageDirectory, promoteCoverageDirectory } from '../../coverage/run-directory.mjs';
export async function executeTests({ cwd, args, runInBand, focusedCoverage, focusedPathMode, timingOutput, runTest, readFilePath, removePath, accessPath, renamePath, write }) {
  const isolatedCoverage = typeof accessPath === 'function' && typeof renamePath === 'function';
  const coverageDirectory = isolatedCoverage ? await prepareCoverageDirectory(cwd, removePath) : undefined;
  let test;
  try { test = await runTest(buildJestArguments({ runnerArguments: args, runInBand, focusedCoverage, focusedPathMode, timingOutput, coverageDirectory }), { cwd, runInBand }); }
  catch (error) {
    const cleanup = isolatedCoverage ? await promoteCoverage(cwd, coverageDirectory, accessPath, removePath, renamePath, write) : undefined;
    if (cleanup) return cleanup;
    write(`Tests failed to start: ${error.message}\n`);
    return { code: EXIT_CODES.TEST_START };
  }
  const result = normalizeTestResult(test);
  if (result.code !== 0) {
    await handleTimingReport({ cwd, timingOutput, readFilePath, removePath, write });
    return result;
  }
  const cleanup = isolatedCoverage ? await promoteCoverage(cwd, coverageDirectory, accessPath, removePath, renamePath, write) : undefined;
  if (cleanup) return cleanup;
  await handleTimingReport({ cwd, timingOutput, readFilePath, removePath, write });
  // Timing diagnostics are best-effort and never change the test result.
  return result;
}

async function promoteCoverage(cwd, coverageDirectory, accessPath, removePath, renamePath, write) {
  try {
    const promoted = await promoteCoverageDirectory(cwd, coverageDirectory, accessPath, removePath, renamePath, (error) => write(`Coverage cleanup warning: ${error.message}\n`));
    if (!promoted) write('Coverage cleanup warning: Jest produced no isolated coverage directory.\n');
  } catch (error) {
    write(`Coverage cleanup failed: ${error.message}\n`);
    return { code: EXIT_CODES.COVERAGE_CLEANUP };
  }
  return undefined;
}
