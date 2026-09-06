import { buildJestArguments } from '../../testing/build-jest-arguments.mjs';
import { normalizeTestResult } from './normalize-test-result.mjs';

export async function runTestProcess({ cwd, args, runInBand, focusedCoverage, focusedPathMode, timingOutput, runTest, runChildProcess }) {
  const result = await runTest(buildJestArguments({ runnerArguments: args, runInBand, focusedCoverage, focusedPathMode, timingOutput }), { cwd, runInBand, runChildProcess, captureTiming: Boolean(timingOutput) });
  return normalizeTestResult(result);
}
