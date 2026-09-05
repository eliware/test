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
  if (lint) return lint;
  timing.step('Lint', 'monolith validation');
  if (enforceMonolithLimits) {
    const monolithResult = await validateMonolith({ cwd, findMonolith, monolithOptions, write, ignoreMonolithLimits });
    if (monolithResult) return monolithResult;
  }
  timing.step('Monolith validation', 'package checks');
  const packageResult = await runPackageChecks(cwd, write, packageChecks);
  return packageResult === 0 ? (normalizedCoverageResult || null) : packageResult;
}
