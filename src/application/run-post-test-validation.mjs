import { validateCoverage } from '../public/stages/coverage.mjs';
import { validateLint } from '../public/stages/lint.mjs';
import { validateMonolith } from '../public/stages/monolith.mjs';

/** Run coverage, lint, and optional monolith gates after successful tests. */
export async function runPostTestValidation({ cwd, testResult, write, readFilePath, statPath, startedAt, ignoreCoverage, runLintCommand, enforceMonolithLimits, findMonolith, ignoreMonolithLimits, timing }) {
  timing.step('Tests', 'coverage');
  if (!ignoreCoverage) {
    const coverageResult = await validateCoverage(cwd, testResult.output, write, readFilePath, statPath, startedAt);
    if (coverageResult) return coverageResult;
  }
  timing.step('Coverage', 'lint');
  const lint = await validateLint(() => runLintCommand({ cwd, write }));
  if (lint) return lint;
  timing.step('Lint', 'monolith validation');
  if (enforceMonolithLimits) {
    const monolithResult = await validateMonolith({ cwd, findMonolith, write, ignoreMonolithLimits });
    if (monolithResult) return monolithResult;
  }
  return null;
}
