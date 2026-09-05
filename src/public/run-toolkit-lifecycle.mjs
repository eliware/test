import { reportToolkitSuccess } from './report-toolkit-success.mjs';
import { runPostTestValidation } from '../application/run-post-test-validation.mjs';
import { runToolkitPreflight } from './run-toolkit-preflight.mjs';
import { runToolkitExecution } from './run-toolkit-execution.mjs';
import { readPackageJson as defaultReadPackageJson } from '../workspace/read-package-json.mjs';

/** Execute the toolkit stages in their documented order. */
export async function runToolkitLifecycle(context) {
  const { cwd, runnerArguments, write, runTest, runLintCommand,
    runInBand, ignoreCoverage, ignoreMonolithLimits, workers, enforceMonolithLimits,
    accessPath, removePath, readFilePath, statPath, renamePath, findIstanbulIgnores,
    runChildProcess, findMonolith, findSourceTestMapping, inspectWorkspace: inspect,
    timing, startedAt, disableInBand, validateConventions, readPackageJson = defaultReadPackageJson } = context;
  const preflight = await runToolkitPreflight({ cwd, runnerArguments, write, accessPath, removePath, readFilePath, findIstanbulIgnores, inspect, debugTiming: context.debugTiming, findSourceTestMapping, timing, validateConventions });
  if (preflight.exitCode !== undefined) return preflight.exitCode;
  const { testResult, outcome: testOutcome } = await runToolkitExecution({ cwd, args: preflight.args, runInBand, disableInBand, preparation: preflight.preparation, runTest, runChildProcess, readFilePath, removePath, accessPath, renamePath, write });
  if (testOutcome !== null) return testOutcome;
  const validationOutcome = await runPostTestValidation({ cwd, testResult, write, readFilePath, statPath, startedAt, ignoreCoverage, runLintCommand, lintOptions: { accessPath, findIstanbulIgnores, debugTiming: context.debugTiming, inspect }, enforceMonolithLimits, findMonolith, monolithOptions: { workers }, ignoreMonolithLimits, timing, packageChecks: { runChildProcess, readPackageJson } });
  if (validationOutcome !== null) return validationOutcome;
  reportToolkitSuccess(write, ignoreCoverage);
  return 0;
}
