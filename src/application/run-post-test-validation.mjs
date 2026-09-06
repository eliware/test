import { runCoverageStage } from './post-test-stages/run-coverage-stage.mjs';
import { runLintStage } from './post-test-stages/run-lint-stage.mjs';
import { runMonolithStage } from './post-test-stages/run-monolith-stage.mjs';
import { runPackageStage } from './post-test-stages/run-package-stage.mjs';
import { selectFailureCode } from './post-test-stages/select-failure-code.mjs';

/** Run coverage, lint, and optional monolith gates after successful tests. */
export async function runPostTestValidation({ cwd, testResult, write, readFilePath, statPath, startedAt, ignoreCoverage, runLintCommand, lintOptions = {}, enforceMonolithLimits, findMonolith, monolithOptions = {}, ignoreMonolithLimits, timing, packageChecks = {}, coverageValidator }) {
  timing.step('Tests', 'coverage');
  const coverageResult = await runCoverageStage({ cwd, testResult, write, readFilePath, statPath, startedAt, ignoreCoverage, coverageValidator });
  timing.step('Coverage', 'lint');
  const lintResult = await runLintStage({ cwd, write, runLintCommand, lintOptions });
  timing.step('Lint', 'monolith validation');
  const monolithResult = await runMonolithStage({ cwd, write, enforceMonolithLimits, findMonolith, monolithOptions, ignoreMonolithLimits });
  timing.step('Monolith validation', 'package checks');
  const packageResult = await runPackageStage({ cwd, write, packageChecks });
  return selectFailureCode(coverageResult, lintResult, monolithResult, packageResult);
}
