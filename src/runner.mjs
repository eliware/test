import { formatCoverageGaps } from './coverage.mjs';
import { MANAGED_OPTIONS } from './arguments.mjs';
import { access, readFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { oxlintExclusionArguments } from './workspace.mjs';
import { findIstanbulIgnoreViolations } from './istanbul.mjs';
import { EXIT_CODES } from './exit-codes.mjs';
import { formatFailure, formatIstanbulIgnoreFailure, hasLintWarnings } from './runner/diagnostics.mjs';
import { findMissingFocusedPath, focusedCoverageArguments, isTestPath } from './runner/focused-path-stage.mjs';
import { COVERAGE_CANDIDATES, pureBarrelSuggestions, readCoverageGaps } from './runner/coverage-stage.mjs';

export async function runToolkit(options) {
  return runToolkitUnlocked(options);
}

async function runToolkitUnlocked({ cwd, runnerArguments, runInBand = true, ignoreCoverage = false, sanitizeEnv = false, write, runTest, runLintCommand, runBuild, runAudit, runPack, accessPath = access, removePath = rm, readFilePath = readFile, findIstanbulIgnores = findIstanbulIgnoreViolations }) {
  if (typeof cwd !== 'string' || !Array.isArray(runnerArguments) || typeof write !== 'function' || typeof runTest !== 'function' || typeof runLintCommand !== 'function') {
    throw new TypeError('runToolkit requires cwd, runnerArguments, write, runTest, and runLintCommand');
  }
  const disableInBand = runnerArguments.includes('--no-runInBand');
  const effectiveRunInBand = runInBand && !disableInBand;
  const normalizedRunnerArguments = runnerArguments.filter((argument) => argument !== '--runInBand' && argument !== '--no-runInBand' && argument !== '--');
  try {
    const violations = await findIstanbulIgnores(cwd);
    if (violations.length > 0) {
      write(formatIstanbulIgnoreFailure(violations));
      return EXIT_CODES.ISTANBUL_POLICY;
    }
    await warnIfMissingGitignore(cwd, write, accessPath);
  } catch (error) {
    write(`Workspace setup failed: ${error.message}\n`);
    return EXIT_CODES.WORKSPACE_SETUP;
  }
  const protectedArgument = normalizedRunnerArguments.find(isProtectedArgument);
  if (protectedArgument) {
    write(`Unsupported Jest option: ${protectedArgument} is managed by eliware-test; remove it and use a supported filter.\n`);
    return EXIT_CODES.INVALID_ARGUMENT;
  }
  let missingFocusedPath;
  try {
    missingFocusedPath = await findMissingFocusedPath(cwd, normalizedRunnerArguments, accessPath);
  } catch (error) {
    write(`Focused test path validation failed: ${error.message}\n`);
    return EXIT_CODES.FOCUSED_PATH_VALIDATION;
  }
  if (missingFocusedPath) {
    write(`Focused test path not found: ${missingFocusedPath}\nUse a path relative to the consuming repository.\n`);
    return EXIT_CODES.FOCUSED_PATH_MISSING;
  }
  if (process.env.ELIWARE_TEST_DEBUG === '1') {
    write(`Debug: Jest arguments: ${normalizedRunnerArguments.map((argument) => JSON.stringify(argument)).join(' ') || '(none)'}\n`);
  }
  try {
    for (const name of COVERAGE_CANDIDATES) await removePath(resolve(cwd, name), { force: true });
  } catch (error) {
    write(`Coverage cleanup failed: ${error.message}\n`);
    return EXIT_CODES.COVERAGE_CLEANUP;
  }
  const focusedArguments = normalizedRunnerArguments;
  const focusedPathMode = focusedArguments.length > 0 && focusedArguments.every(isTestPath);
  const focusedCoverage = focusedPathMode ? await focusedCoverageArguments(cwd, focusedArguments, accessPath) : [];
  if (focusedPathMode && focusedCoverage.length === 0 && process.env.ELIWARE_TEST_DEBUG === '1') {
    write('Debug: Focused source mapping was ambiguous or unavailable; broad coverage enforcement retained.\n');
  }
  let test;
  try {
    test = (await runTest(['--coverage', ...(effectiveRunInBand ? ['--runInBand'] : []), '--detectOpenHandles', '--silent', '--coverageReporters=text', '--coverageReporters=json', ...focusedCoverage, ...(focusedPathMode ? ['--runTestsByPath'] : []), ...focusedArguments], { cwd, runInBand: effectiveRunInBand, inheritEnv: !sanitizeEnv })) ?? {};
  } catch (error) {
    write(`Tests failed to start: ${error.message}\n`);
    return EXIT_CODES.TEST_START;
  }
  const testResult = { ...test, output: typeof test.output === 'string' ? test.output : '', code: Number.isInteger(test.code) ? test.code : 1 };
  if (testResult.code !== 0) {
    write(formatFailure('Tests', testResult));
    return EXIT_CODES.TEST_FAILURE;
  }
  let gaps = [];
  if (!ignoreCoverage) {
    try {
    gaps = await readCoverageGaps(cwd, testResult.output, write, readFilePath);
    } catch (error) {
      write(`Coverage failed: ${error.message}\n`);
      return EXIT_CODES.COVERAGE_FAILURE;
    }
  }
  if (gaps.length > 0) {
    const barrelSuggestions = await pureBarrelSuggestions(cwd, gaps, readFilePath);
    write(`${formatCoverageGaps(gaps, cwd)}${barrelSuggestions}\n`);
    return EXIT_CODES.COVERAGE_GAP;
  }
  let buildScript;
  try { buildScript = await configuredBuildScript(cwd, readFilePath); }
  catch (error) { write(`Build configuration failed: ${error.message}\n`); return EXIT_CODES.BUILD_FAILURE; }
  if (buildScript && runBuild) {
    let build;
    try { build = (await runBuild(['run', 'build'], { cwd, inheritEnv: !sanitizeEnv })) ?? {}; }
    catch (error) { write(`Build failed to start: ${error.message}\n`); return EXIT_CODES.BUILD_FAILURE; }
    build = { ...build, output: typeof build.output === 'string' ? build.output : '', code: Number.isInteger(build.code) ? build.code : 1 };
    if (build.code !== 0) { write(formatFailure('Build', build)); return EXIT_CODES.BUILD_FAILURE; }
  }
  let lint;
  try {
    lint = (await runLintCommand(['oxlint', '--deny-warnings', '.', ...oxlintExclusionArguments()], { cwd, inheritEnv: !sanitizeEnv })) ?? {};
  } catch (error) {
    write(`Lint failed to start: ${error.message}\n`);
    return EXIT_CODES.LINT_START;
  }
  lint = { ...lint, output: typeof lint.output === 'string' ? lint.output : '', code: Number.isInteger(lint.code) ? lint.code : 1 };
  if (lint.code !== 0 || hasLintWarnings(lint.output)) {
    write(formatFailure('Lint', lint));
    return EXIT_CODES.LINT_FAILURE;
  }
  for (const [label, command, code] of [['Audit', runAudit, EXIT_CODES.AUDIT_FAILURE], ['Pack', runPack, EXIT_CODES.PACK_FAILURE]]) {
    if (!command) continue;
    let result;
    try {
      result = (await command(label === 'Audit' ? ['audit', '--omit=dev', '--audit-level=moderate', '--ignore-scripts'] : ['pack', '--dry-run', '--ignore-scripts'], { cwd, inheritEnv: !sanitizeEnv })) ?? {};
    } catch (error) {
      write(`${label} failed to start: ${error.message}\n`);
      return code;
    }
    const normalized = { ...result, output: typeof result.output === 'string' ? result.output : '', code: Number.isInteger(result.code) ? result.code : 1 };
    if (normalized.code !== 0) {
      write(formatFailure(label, normalized));
      return code;
    }
  }
  write(ignoreCoverage ? 'Tests passed | Coverage: ignored | Lint: 0 warnings\n' : 'Tests passed | Coverage: 100×4 | Lint: 0 warnings\n');
  return 0;
}

async function configuredBuildScript(cwd, readFilePath) {
  let raw;
  try { raw = await readFilePath(resolve(cwd, 'package.json'), 'utf8'); }
  catch (error) { if (error.code === 'ENOENT') return ''; throw error; }
  const packageJson = JSON.parse(raw);
  return typeof packageJson?.scripts?.build === 'string' && packageJson.scripts.build.trim() ? packageJson.scripts.build : '';
}

function isProtectedArgument(argument) {
  return MANAGED_OPTIONS
    .some((name) => argument === name || argument.startsWith(`${name}=`));
}


export async function runLint({ cwd, write, runLintCommand, sanitizeEnv = false, accessPath = access, findIstanbulIgnores = findIstanbulIgnoreViolations }) {
  if (typeof cwd !== 'string' || typeof write !== 'function' || typeof runLintCommand !== 'function') {
    throw new TypeError('runLint requires cwd, write, and runLintCommand');
  }
  try {
    const violations = await findIstanbulIgnores(cwd);
    if (violations.length > 0) {
      write(formatIstanbulIgnoreFailure(violations));
      return EXIT_CODES.ISTANBUL_POLICY;
    }
    await warnIfMissingGitignore(cwd, write, accessPath);
  } catch (error) {
    write(`Workspace setup failed: ${error.message}\n`);
    return EXIT_CODES.WORKSPACE_SETUP;
  }
  let lint;
  try {
    lint = (await runLintCommand(['oxlint', '--deny-warnings', '.', ...oxlintExclusionArguments()], { cwd, inheritEnv: !sanitizeEnv })) ?? {};
  } catch (error) {
    write(`Lint failed to start: ${error.message}\n`);
    return EXIT_CODES.LINT_START;
  }
  const exitCode = Number.isInteger(lint.code) ? lint.code : 1;
  const lintOutput = typeof lint.output === 'string' ? lint.output : '';
  if (exitCode !== 0 || hasLintWarnings(lintOutput)) write(formatFailure('Lint', { ...lint, code: exitCode, output: lintOutput }));
  else write('Lint passed: 0 warnings\n');
  return exitCode !== 0 || hasLintWarnings(lintOutput) ? EXIT_CODES.LINT_FAILURE : 0;
}


async function warnIfMissingGitignore(cwd, write, accessPath) {
  try {
    await accessPath(resolve(cwd, '.gitignore'));
  } catch (error) {
    if (error.code === 'ENOENT') {
      write('Warning: .gitignore is missing. Recommended entries: node_modules/, coverage/, test-results/, and *.tgz.\n');
      return;
    }
    throw error;
  }
}
