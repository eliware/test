import { validateCoverage } from '../public/stages/coverage.mjs';
import { validateLint } from '../public/stages/lint.mjs';
import { validateMonolith } from '../public/stages/monolith.mjs';
import { runAudit } from './run-audit.mjs';
import { runPack } from './run-pack.mjs';
import { runBuild } from './run-build.mjs';
import { runTypecheck } from './run-typecheck.mjs';
import { EXIT_CODES } from '../exit-codes/codes.mjs';

/** Run coverage, lint, and optional monolith gates after successful tests. */
export async function runPostTestValidation({ cwd, testResult, write, readFilePath, statPath, startedAt, ignoreCoverage, runLintCommand, lintOptions = {}, enforceMonolithLimits, findMonolith, monolithOptions = {}, ignoreMonolithLimits, timing, packageChecks = {} }) {
  timing.step('Tests', 'coverage');
  if (!ignoreCoverage) {
    const coverageResult = await validateCoverage(cwd, testResult.output, write, readFilePath, statPath, startedAt);
    if (coverageResult) return coverageResult;
  }
  timing.step('Coverage', 'lint');
  const lint = await validateLint(() => runLintCommand({ ...lintOptions, cwd, write }));
  if (lint) return lint;
  timing.step('Lint', 'monolith validation');
  if (enforceMonolithLimits) {
    const monolithResult = await validateMonolith({ cwd, findMonolith, monolithOptions, write, ignoreMonolithLimits });
    if (monolithResult) return monolithResult;
  }
  timing.step('Monolith validation', 'package checks');
  const checks = [['audit', runAudit], ['pack', runPack], ['build', runBuild], ['typecheck', runTypecheck]];
  for (const [name, check] of checks) {
    if (await check(cwd, write, { ...packageChecks, readFilePath }) !== 0) {
      write(`Package script failed: ${name}\n`);
      return EXIT_CODES.PACKAGE_SCRIPT_FAILURE;
    }
  }
  return null;
}
