import { validateToolkitOptions } from './validate-toolkit-options.mjs';
import { createTiming } from '../diagnostics/timing.mjs';
import { reportToolkitSuccess } from './report-toolkit-success.mjs';
import { resolveToolkitOptions } from './resolve-toolkit-options.mjs';
import { runPostTestValidation } from '../application/run-post-test-validation.mjs';
import { runToolkitPreflight } from './run-toolkit-preflight.mjs';
import { runToolkitExecution } from './run-toolkit-execution.mjs';
import { EXIT_CODES } from '../exit-codes/codes.mjs';

/**
 * Public toolkit API. The application pipeline owns execution; this boundary
 * validates the minimum caller contract and preserves the numeric exit code.
 */
export async function runToolkit(options) {
  validateToolkitOptions(options);
  try {
    return await runToolkitInternal(options);
  } catch (error) {
    options.write(`Toolkit failed: ${error instanceof Error ? error.message : String(error)}\n`);
    return EXIT_CODES.INTERNAL;
  }
}

async function runToolkitInternal(options) {
  const { cwd, runnerArguments, write, runTest, runLintCommand,
    runInBand, ignoreCoverage, ignoreMonolithLimits, enforceMonolithLimits,
    accessPath, removePath, readFilePath, findIstanbulIgnores,
    findMonolith, findSourceTestMapping, inspectWorkspace: inspect } = resolveToolkitOptions(options);
  const timing = createTiming(options.debugTiming, write);
  const disableInBand = runnerArguments.includes('--no-runInBand');
  const preflight = await runToolkitPreflight({ cwd, runnerArguments, write, accessPath, removePath, findIstanbulIgnores, inspect, debugTiming: options.debugTiming, findSourceTestMapping, timing });
  if (preflight.exitCode !== undefined) return preflight.exitCode;
  const { testResult, outcome: testOutcome } = await runToolkitExecution({ cwd, args: preflight.args, runInBand, disableInBand, preparation: preflight.preparation, runTest, readFilePath, removePath, write });
  if (testOutcome !== null) return testOutcome;
  const validationOutcome = await runPostTestValidation({ cwd, testResult, write, readFilePath, ignoreCoverage, runLintCommand, enforceMonolithLimits, findMonolith, ignoreMonolithLimits, timing });
  if (validationOutcome !== null) return validationOutcome;
  if (preflight.architecture) return preflight.architecture;
  reportToolkitSuccess(write, ignoreCoverage);
  return 0;
}
