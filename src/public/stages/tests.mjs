import { resolve } from 'node:path';
import { buildJestArguments } from '../../testing/build-jest-arguments.mjs';
import { formatTestTimings } from '../../diagnostics/format-test-timings.mjs';
import { EXIT_CODES } from '../../exit-codes/codes.mjs';
export async function executeTests({ cwd, args, runInBand, focusedCoverage, focusedPathMode, timingOutput, runTest, readFilePath, removePath, write }) {
  let test;
  try { test = await runTest(buildJestArguments({ runnerArguments: args, runInBand, focusedCoverage, focusedPathMode, timingOutput }), { cwd, runInBand }); }
  catch (error) { write(`Tests failed to start: ${error.message}\n`); return { code: EXIT_CODES.TEST_START }; }
  const result = { ...test, code: Number.isInteger(test?.code) ? test.code : 1, output: typeof test?.output === 'string' ? test.output : '' };
  if (timingOutput) {
    try { write(formatTestTimings(JSON.parse(await readFilePath(timingOutput, 'utf8')))); } catch (error) { write(`Timing report unavailable: ${error.message}\n`); }
    try { await removePath(resolve(cwd, '.eliware-test-timings.json'), { force: true }); } catch (error) { write(`Coverage cleanup failed: ${error.message}\n`); return { code: EXIT_CODES.COVERAGE_CLEANUP }; }
  }
  return result;
}
