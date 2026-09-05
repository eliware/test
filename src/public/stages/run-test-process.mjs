import { buildJestArguments } from '../../testing/build-jest-arguments.mjs';
import { normalizeTestResult } from './normalize-test-result.mjs';

export async function runTestProcess({ cwd, args, runInBand, focusedCoverage, focusedPathMode, timingOutput, coverageDirectory, runTest, runChildProcess }) {
  const result = await runTest(buildJestArguments({ runnerArguments: args, runInBand, focusedCoverage, focusedPathMode, timingOutput, coverageDirectory }), { cwd, runInBand, runChildProcess });
  return normalizeTestResult(result);
}
