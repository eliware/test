import { runCoverageStage } from './post-test-stages/run-coverage-stage.mjs';
import { runLintStage } from './post-test-stages/run-lint-stage.mjs';
import { runMonolithStage } from './post-test-stages/run-monolith-stage.mjs';
import { runPackageStage } from './post-test-stages/run-package-stage.mjs';
import { selectFailureCode } from './post-test-stages/select-failure-code.mjs';
import { EXIT_CODES } from '../exit-codes/codes.mjs';

/** Run coverage, lint, and optional monolith gates after successful tests. */
export async function runPostTestValidation({ cwd, testResult, write, readFilePath, statPath, startedAt, ignoreCoverage, runLintCommand, lintOptions = {}, enforceMonolithLimits, findMonolith, monolithOptions = {}, ignoreMonolithLimits, timing, packageChecks = {}, coverageValidator }) {
  const step = typeof timing?.step === 'function' ? timing.step.bind(timing) : () => {};
  step('Tests', 'coverage');
  const coverageResult = await runCoverageStage({ cwd, testResult, write, readFilePath, statPath, startedAt, ignoreCoverage, coverageValidator });
  step('Coverage', 'lint');
  const lintResult = await runLintStage({ cwd, write, runLintCommand, lintOptions });
  step('Lint', 'monolith validation');
  const monolithResult = await runMonolithStage({ cwd, write, enforceMonolithLimits, findMonolith, monolithOptions, ignoreMonolithLimits });
  step('Monolith validation', 'package checks');
  let packageResult;
  try { packageResult = await runPackageStage({ cwd, write, packageChecks }); }
  catch (error) {
    write(`Package validation failed: ${error?.message ?? String(error)}\n`);
    packageResult = EXIT_CODES.PACKAGE_SCRIPT_FAILURE;
  }
  return selectFailureCode(coverageResult, lintResult, monolithResult, packageResult);
}
