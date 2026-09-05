import { validateCoverage } from '../public/stages/coverage.mjs';
import { validateLint } from '../public/stages/lint.mjs';
import { validateMonolith } from '../public/stages/monolith.mjs';
import { runPackageChecks } from './run-package-checks.mjs';

/** Run coverage, lint, and optional monolith gates after successful tests. */
export async function runPostTestValidation({ cwd, testResult, write, readFilePath, statPath, startedAt, ignoreCoverage, runLintCommand, lintOptions = {}, enforceMonolithLimits, findMonolith, monolithOptions = {}, ignoreMonolithLimits, timing, packageChecks = {} }) {
  timing.step('Tests', 'coverage');
  const coverageResult = ignoreCoverage ? 0 : await validateCoverage(cwd, testResult.output, write, readFilePath, statPath, startedAt);
  timing.step('Coverage', 'lint');
  const lint = await validateLint(() => runLintCommand({ ...lintOptions, cwd, write }));
  if (lint) return lint;
  timing.step('Lint', 'monolith validation');
  if (enforceMonolithLimits) {
    const monolithResult = await validateMonolith({ cwd, findMonolith, monolithOptions, write, ignoreMonolithLimits });
    if (monolithResult) return monolithResult;
  }
  timing.step('Monolith validation', 'package checks');
  const packageResult = await runPackageChecks(cwd, write, packageChecks);
  return packageResult === 0 ? (coverageResult || null) : packageResult;
}
