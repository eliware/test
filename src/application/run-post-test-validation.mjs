import { validateCoverage } from '../public/stages/coverage.mjs';
import { validateLint } from '../public/stages/lint.mjs';
import { validateMonolith } from '../public/stages/monolith.mjs';
import { runPackageChecks } from './run-package-checks.mjs';
import { EXIT_CODES } from '../exit-codes/codes.mjs';

/** Run coverage, lint, and optional monolith gates after successful tests. */
export async function runPostTestValidation({ cwd, testResult, write, readFilePath, statPath, startedAt, ignoreCoverage, runLintCommand, lintOptions = {}, enforceMonolithLimits, findMonolith, monolithOptions = {}, ignoreMonolithLimits, timing, packageChecks = {}, coverageValidator = validateCoverage }) {
  timing.step('Tests', 'coverage');
  const coverageResult = ignoreCoverage ? 0 : await coverageValidator(cwd, testResult.output, write, readFilePath, statPath, startedAt);
  const normalizedCoverageResult = Number.isInteger(coverageResult) ? coverageResult : EXIT_CODES.COVERAGE_FAILURE;
  timing.step('Coverage', 'lint');
  const lint = await validateLint(() => runLintCommand({ ...lintOptions, cwd, write, reportSuccess: false }));
  timing.step('Lint', 'monolith validation');
  let monolithResult = 0;
  if (enforceMonolithLimits) {
    monolithResult = await validateMonolith({ cwd, findMonolith, monolithOptions, write, ignoreMonolithLimits });
  }
  timing.step('Monolith validation', 'package checks');
  const packageResult = await runPackageChecks(cwd, write, packageChecks);
  if (packageResult !== 0) return packageResult;
  if (monolithResult !== 0) return monolithResult;
  if (lint !== 0) return lint;
  return normalizedCoverageResult || null;
}
