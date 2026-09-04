import { executeTests } from './stages/tests.mjs';
import { handleTestResult } from './stages/handle-test-result.mjs';

export async function runToolkitExecution({ cwd, args, runInBand, disableInBand, preparation, runTest, readFilePath, removePath, write }) {
  const testResult = await executeTests({
    cwd,
    args,
    runInBand: runInBand && !disableInBand,
    focusedCoverage: preparation.focusedCoverage,
    focusedPathMode: preparation.focusedPathMode,
    timingOutput: preparation.timingOutput,
    runTest,
    readFilePath,
    removePath,
    write,
  });
  return { testResult, outcome: handleTestResult(testResult, write, cwd) };
}
