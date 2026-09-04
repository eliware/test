import { access, readFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { EXIT_CODES } from '../exit-codes/codes.mjs';
import { MANAGED_OPTIONS } from '../arguments/classify-arguments.mjs';
import { normalizeArguments } from '../arguments/normalize-arguments.mjs';
import { validateFocusedPaths } from '../testing/validate-focused-paths.mjs';
import { resolveFocusedCoverage } from '../testing/focused-coverage/resolve-selection.mjs';
import { buildJestArguments } from '../testing/build-jest-arguments.mjs';
import { runJest } from '../testing/run-jest.mjs';
import { formatFailure } from '../diagnostics/format-failure.mjs';
import { inspectWorkspace } from '../workspace/inspect-workspace.mjs';
import { configuredScript } from '../validation/common/configured-script.mjs';
import { detectBuildScript } from '../validation/build/detect-script.mjs';
import { detectViolations } from '../monolith/detect-violations.mjs';
import { formatMonolithViolations } from '../diagnostics/format-monolith-violations.mjs';
import { readCoverage } from '../coverage/read-coverage.mjs';
import { formatGaps } from '../coverage/format-gaps.mjs';
import { createTiming } from '../diagnostics/timing.mjs';
import { formatTestTimings } from '../diagnostics/format-test-timings.mjs';
import { runChildProcess } from '../processes/run-child-process.mjs';
import { debugOutput } from '../diagnostics/debug-output.mjs';
import { normalizeValidationResult } from '../validation/common/validation-result.mjs';

const COVERAGE_CANDIDATES = ['coverage/coverage-final.json', 'coverage/coverage.json', 'coverage.json'];

/**
 * Public toolkit API. The application pipeline owns execution; this boundary
 * validates the minimum caller contract and preserves the numeric exit code.
 */
export async function runToolkit(options) {
  if (!options || typeof options !== 'object') throw new TypeError('runToolkit options are required');
  if (typeof options.cwd !== 'string' || !Array.isArray(options.runnerArguments)) throw new TypeError('runToolkit requires cwd and runnerArguments');
  const { cwd, runnerArguments, write, runTest = runJest, runLintCommand, runBuild: build,
    runTypecheck: typecheck, runAudit: audit, runPack: pack,
    runInBand = true, ignoreCoverage = false, ignoreMonolithLimits = false,
    enforceMonolithLimits = false, sanitizeEnv = false, accessPath = access,
    removePath = rm, readFilePath = readFile,
    findIstanbulIgnores, findMonolith = detectViolations,
    inspectWorkspace: inspect = (options.runTest && !findIstanbulIgnores ? async () => true : inspectWorkspace) } = options;
  const timing = createTiming(options.debugTiming, write);
  if (typeof write !== 'function' || typeof runTest !== 'function' || typeof runLintCommand !== 'function') {
    throw new TypeError('runToolkit requires cwd, runnerArguments, write, runTest, and runLintCommand');
  }
  if (options.requireReleaseStages && (typeof audit !== 'function' || typeof pack !== 'function')) {
    throw new TypeError('runToolkit requires audit and pack collaborators for release validation');
  }
  const disableInBand = runnerArguments.includes('--no-runInBand');
  const timingOutput = options.debugTiming ? resolve(cwd, '.eliware-test-timings.json') : undefined;
  if (!await inspect(cwd, write, accessPath, findIstanbulIgnores)) return EXIT_CODES.ISTANBUL_POLICY;
  timing.step('Workspace inspection', 'tests');
  const args = normalizeArguments(runnerArguments);
  const protectedArgument = args.find((argument) => MANAGED_OPTIONS.some((name) => argument === name || argument.startsWith(`${name}=`)));
  if (protectedArgument) { write(`Unsupported Jest option: ${protectedArgument} is managed by eliware-test; remove it and use a supported filter.\n`); return EXIT_CODES.INVALID_ARGUMENT; }
  const missing = await validateFocusedPaths(cwd, args, accessPath);
  if (missing) { write(`Focused test path not found: ${missing}\nUse a path relative to the consuming repository.\n`); return EXIT_CODES.FOCUSED_PATH_MISSING; }
  try {
    for (const candidate of COVERAGE_CANDIDATES) await removePath(resolve(cwd, candidate), { force: true });
  } catch (error) {
    write(`Coverage cleanup failed: ${error.message}\n`);
    return EXIT_CODES.COVERAGE_CLEANUP;
  }
  const focusedPathMode = args.some((arg) => /(?:^|[\\/])tests?[\\/].+\.(?:mjs|js|cjs|jsx|ts|tsx)$/.test(arg));
  const focusedCoverage = focusedPathMode ? await resolveFocusedCoverage(cwd, args, accessPath) : [];
  if (timingOutput) {
    try { await removePath(timingOutput, { force: true }); }
    catch (error) { write(`Coverage cleanup failed: ${error.message}\n`); return EXIT_CODES.COVERAGE_CLEANUP; }
  }
  let test;
  try { test = await runTest(buildJestArguments({ runnerArguments: args, runInBand: runInBand && !disableInBand, focusedCoverage, focusedPathMode, timingOutput }), { cwd, runInBand: runInBand && !disableInBand, inheritEnv: !sanitizeEnv }); }
  catch (error) { write(`Tests failed to start: ${error.message}\n`); return EXIT_CODES.TEST_START; }
  const testResult = { ...test, code: Number.isInteger(test?.code) ? test.code : 1, output: typeof test?.output === 'string' ? test.output : '' };
  if (timingOutput) {
    try { write(formatTestTimings(JSON.parse(await readFilePath(timingOutput, 'utf8')))); } catch { /* Jest may fail before producing a report. */ }
    try { await removePath(timingOutput, { force: true }); }
    catch (error) { write(`Coverage cleanup failed: ${error.message}\n`); return EXIT_CODES.COVERAGE_CLEANUP; }
  }
  if (testResult.code !== 0) { write(formatFailure('Tests', testResult)); return EXIT_CODES.TEST_FAILURE; }
  timing.step('Tests', 'coverage');
  if (!ignoreCoverage) {
    const coverageGaps = await readCoverage(cwd, testResult.output, write, readFilePath);
    if (coverageGaps.length) {
      write(formatGaps(coverageGaps, cwd));
      return EXIT_CODES.COVERAGE_GAP;
    }
  }
  timing.step('Coverage', 'build');
  const context = { cwd, sanitizeEnv, write, runBuild: build, runTypecheck: typecheck, runLintCommand, runAudit: audit, runPack: pack, runChildProcess, timeoutMs: options.validationTimeoutMs };
  const buildScript = await detectBuildScript(cwd, readFilePath);
  const typecheckScript = await configuredScript(cwd, 'typecheck', readFilePath);
  debugOutput(write, 'Validation stages', {
    build: Boolean(buildScript), typecheck: Boolean(typecheckScript),
    audit: typeof audit === 'function', pack: typeof pack === 'function'
  });
  let code = 0;
  if (buildScript && typeof build === 'function') {
    try { code = resultCode(await build(context, buildScript)); }
    catch (error) { write(`Build failed to start: ${error.message}\n`); return EXIT_CODES.BUILD_FAILURE; }
    if (code) return EXIT_CODES.BUILD_FAILURE;
  }
  if (typecheckScript && typeof typecheck === 'function') {
    try { code = resultCode(await typecheck(context, typecheckScript)); }
    catch (error) { write(`Typecheck failed to start: ${error.message}\n`); return EXIT_CODES.TYPECHECK_FAILURE; }
    if (code) return EXIT_CODES.TYPECHECK_FAILURE;
  }
  const lint = resultCode(await runLintCommand({ cwd, write, sanitizeEnv }));
  if (lint) return lint;
  timing.step('Lint', 'package checks');
  if (typeof audit === 'function') {
    code = await runValidationStage('Audit', () => audit(context), EXIT_CODES.AUDIT_FAILURE, write);
    if (code) return code;
  }
  if (typeof pack === 'function') {
    code = await runValidationStage('Pack', () => pack(context), EXIT_CODES.PACK_FAILURE, write);
    if (code) return code;
  }
  timing.step('Package checks', 'monolith validation');
  if (enforceMonolithLimits) {
    try {
      const violations = await findMonolith(cwd);
      if (violations.length) {
        write(formatMonolithViolations(violations));
        if (!ignoreMonolithLimits) return EXIT_CODES.MONOLITH_LIMIT;
        write('Monolith limits ignored for this diagnostic/refactoring run.\n');
      }
    } catch (error) {
      write(`Monolith validation failed: ${error.message}\n`);
      return EXIT_CODES.MONOLITH_LIMIT;
    }
  }
  write(ignoreCoverage ? 'Tests passed | Coverage: ignored | Lint: 0 warnings\n' : 'Tests passed | Coverage: 100×4 | Lint: 0 warnings\n');
  return 0;
}

function resultCode(result) {
  return normalizeValidationResult(Number.isInteger(result) ? { code: result } : result).code;
}

async function runValidationStage(name, run, failureCode, write) {
  try {
    const result = normalizeValidationResult(await run());
    if (result.code !== 0) write(formatFailure(name, result));
    return result.code === 0 ? 0 : failureCode;
  } catch (error) {
    write(`${name} failed to start: ${error.message}\n`);
    return failureCode;
  }
}
