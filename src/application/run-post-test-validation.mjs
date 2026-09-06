import { validateCoverage } from '../public/stages/coverage.mjs';
import { validateLint } from '../public/stages/lint.mjs';
import { validateMonolith } from '../public/stages/monolith.mjs';
import { runPackageChecks } from './run-package-checks.mjs';
import { EXIT_CODES } from '../exit-codes/codes.mjs';

/** Run coverage, lint, and optional monolith gates after successful tests. */
export async function runPostTestValidation({ cwd, testResult, write, readFilePath, statPath, startedAt, ignoreCoverage, runLintCommand, lintOptions = {}, enforceMonolithLimits, findMonolith, monolithOptions = {}, ignoreMonolithLimits, timing, packageChecks = {}, coverageValidator = validateCoverage }) {
  timing.step('Tests', 'coverage');
  let coverageResult = 0;
  if (!ignoreCoverage) {
    try { coverageResult = await coverageValidator(cwd, testResult.output, write, readFilePath, statPath, startedAt); }
    catch (error) {
      write(`Coverage validation failed: ${error?.message ?? String(error)}\n`);
      coverageResult = EXIT_CODES.COVERAGE_FAILURE;
    }
  }
  const normalizedCoverageResult = Number.isInteger(coverageResult) ? coverageResult : EXIT_CODES.COVERAGE_FAILURE;
  timing.step('Coverage', 'lint');
  let lint;
  try { lint = await validateLint(() => runLintCommand({ ...lintOptions, cwd, write, reportSuccess: false })); }
  catch (error) {
    write(`Lint validation failed: ${error?.message ?? String(error)}\n`);
    lint = EXIT_CODES.LINT_FAILURE;
  }
  timing.step('Lint', 'monolith validation');
  let monolithResult = 0;
  if (enforceMonolithLimits) {
    monolithResult = await validateMonolith({ cwd, findMonolith, monolithOptions, write, ignoreMonolithLimits });
  }
  timing.step('Monolith validation', 'package checks');
  const packageResult = await runPackageChecks(cwd, write, packageChecks);
  const failures = [normalizedCoverageResult, lint, monolithResult, packageResult].filter((code) => Number.isInteger(code) && code > 0);
  return failures.length ? Math.max(...failures) : null;
}
