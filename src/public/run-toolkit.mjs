import { access, readFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { EXIT_CODES } from '../exit-codes/codes.mjs';
import { MANAGED_OPTIONS } from '../arguments/classify-arguments.mjs';
import { normalizeArguments } from '../arguments/normalize-arguments.mjs';
import { validateFocusedPaths } from '../testing/validate-focused-paths.mjs';
import { resolveFocusedCoverage } from '../testing/focused-coverage/resolve-selection.mjs';
import { runJest } from '../testing/run-jest.mjs';
import { runLintCommand as defaultRunLintCommand } from '../application/run-lint-command.mjs';
import { assertToolkitOptions } from './contracts.mjs';
import { formatFailure } from '../diagnostics/format-failure.mjs';
import { inspectWorkspace } from '../workspace/inspect-workspace.mjs';
import { detectViolations } from '../monolith/detect-violations.mjs';
import { createTiming } from '../diagnostics/timing.mjs';
import { cleanupCoverage } from './stages/cleanup.mjs';
import { executeTests } from './stages/tests.mjs';
import { validateCoverage } from './stages/coverage.mjs';
import { validateLint } from './stages/lint.mjs';
import { validateMonolith } from './stages/monolith.mjs';

const COVERAGE_CANDIDATES = ['coverage/coverage-final.json', 'coverage/coverage.json', 'coverage.json'];

/**
 * Public toolkit API. The application pipeline owns execution; this boundary
 * validates the minimum caller contract and preserves the numeric exit code.
 */
export async function runToolkit(options) {
  assertToolkitOptions(options);
  const { cwd, runnerArguments, write, runTest = runJest, runLintCommand = defaultRunLintCommand,
    runInBand = true, ignoreCoverage = false, ignoreMonolithLimits = false,
    enforceMonolithLimits = false, accessPath = access,
    removePath = rm, readFilePath = readFile,
    findIstanbulIgnores, findMonolith = detectViolations,
    inspectWorkspace: inspect = (options.runTest && !findIstanbulIgnores ? async () => true : inspectWorkspace) } = options;
  const timing = createTiming(options.debugTiming, write);
  const disableInBand = runnerArguments.includes('--no-runInBand');
  const timingOutput = options.debugTiming ? resolve(cwd, '.eliware-test-timings.json') : undefined;
  if (!await inspect(cwd, write, accessPath, findIstanbulIgnores)) return EXIT_CODES.ISTANBUL_POLICY;
  timing.step('Workspace inspection', 'tests');
  const args = normalizeArguments(runnerArguments);
  const protectedArgument = args.find((argument) => MANAGED_OPTIONS.some((name) => argument === name || argument.startsWith(`${name}=`)));
  if (protectedArgument) { write(`Unsupported Jest option: ${protectedArgument} is managed by eliware-test; remove it and use a supported filter.\n`); return EXIT_CODES.INVALID_ARGUMENT; }
  const missing = await validateFocusedPaths(cwd, args, accessPath);
  if (missing) { write(`Focused test path not found: ${missing}\nUse a path relative to the consuming repository.\n`); return EXIT_CODES.FOCUSED_PATH_MISSING; }
  if (!await cleanupCoverage(cwd, removePath, COVERAGE_CANDIDATES, write)) return EXIT_CODES.COVERAGE_CLEANUP;
  const focusedPathMode = args.some((arg) => /(?:^|[\\/])tests?[\\/].+\.(?:mjs|js|cjs|jsx|ts|tsx)$/.test(arg));
  const focusedCoverage = focusedPathMode ? await resolveFocusedCoverage(cwd, args, accessPath) : [];
  if (timingOutput) {
    try { await removePath(timingOutput, { force: true }); }
    catch (error) { write(`Coverage cleanup failed: ${error.message}\n`); return EXIT_CODES.COVERAGE_CLEANUP; }
  }
  const test = await executeTests({ cwd, args, runInBand: runInBand && !disableInBand, focusedCoverage, focusedPathMode, timingOutput, runTest, readFilePath, removePath, write });
  if (test.code === EXIT_CODES.TEST_START) return test.code;
  const testResult = test;
  if (timingOutput) {
    try { write(formatTestTimings(JSON.parse(await readFilePath(timingOutput, 'utf8')))); }
    catch (error) { write(`Timing report unavailable: ${error.message}\n`); }
    try { await removePath(timingOutput, { force: true }); }
    catch (error) { write(`Coverage cleanup failed: ${error.message}\n`); return EXIT_CODES.COVERAGE_CLEANUP; }
  }
  if (testResult.code !== 0) { write(formatFailure('Tests', testResult)); return EXIT_CODES.TEST_FAILURE; }
  timing.step('Tests', 'coverage');
  if (!ignoreCoverage) {
    const coverageResult = await validateCoverage(cwd, testResult.output, write, readFilePath);
    if (coverageResult) return coverageResult;
  }
  timing.step('Coverage', 'lint');
  const lint = await validateLint(runLintCommand, cwd, write);
  if (lint) return lint;
  timing.step('Lint', 'monolith validation');
  if (enforceMonolithLimits) {
    const monolithResult = await validateMonolith({ cwd, findMonolith, write, ignoreMonolithLimits });
    if (monolithResult) return monolithResult;
  }
  write(ignoreCoverage ? 'Tests passed | Coverage: ignored | Lint: 0 warnings\n' : 'Tests passed | Coverage: 100×4 | Lint: 0 warnings\n');
  return 0;
}
