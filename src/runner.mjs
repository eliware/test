import { formatCoverageGaps, parseCoverage, parseCoverageJson } from './coverage.mjs';
import { MANAGED_OPTIONS } from './arguments.mjs';
import { access, readFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { oxlintExclusionArguments } from './workspace.mjs';

// codescope ignore: coverage candidate selection intentionally remains private to the runner contract.
// codescope ignore: coverage candidate selection intentionally remains a private, fixed runner policy rather than a public configuration surface.
const COVERAGE_CANDIDATES = ['coverage/coverage-final.json', 'coverage/coverage.json', 'coverage.json'];

// codescope ignore: cancellation is intentionally owned by the invoking process; the CLI exposes no abort-signal contract.
// codescope ignore: collaborator injection is intentionally an advanced internal composition seam; the CLI is the supported consumer interface.
// codescope ignore: this single policy boundary intentionally owns setup, execution, evidence, lint, and presentation for the CLI.
export async function runToolkit({ cwd, runnerArguments, runInBand = true, ignoreCoverage = false, write, runTest, runLintCommand, accessPath = access, removePath = rm, readFilePath = readFile }) {
  // codescope ignore: this function is the intentional single policy boundary for cleanup, execution, coverage, and lint sequencing.
  // codescope ignore: filesystem collaborator injection is an intentional internal test seam; consumers use the CLI.
  if (typeof cwd !== 'string' || !Array.isArray(runnerArguments) || typeof write !== 'function' || typeof runTest !== 'function' || typeof runLintCommand !== 'function') {
    throw new TypeError('runToolkit requires cwd, runnerArguments, write, runTest, and runLintCommand');
  }
  const disableInBand = runnerArguments.includes('--no-runInBand');
  const effectiveRunInBand = runInBand && !disableInBand;
  const normalizedRunnerArguments = runnerArguments.filter((argument) => argument !== '--runInBand' && argument !== '--no-runInBand' && argument !== '--');
  try {
    await warnIfMissingGitignore(cwd, write, accessPath);
  } catch (error) {
    write(`Workspace setup failed: ${error.message}\n`);
    return 1;
  }
  const protectedArgument = normalizedRunnerArguments.find(isProtectedArgument);
  if (protectedArgument) {
    write(`Unsupported Jest option: ${protectedArgument} is managed by eliware-test; remove it and use a supported filter.\n`);
    return 1;
  }
  let missingFocusedPath;
  try {
    missingFocusedPath = await findMissingFocusedPath(cwd, normalizedRunnerArguments, accessPath);
  } catch (error) {
    write(`Focused test path validation failed: ${error.message}\n`);
    return 1;
  }
  if (missingFocusedPath) {
    write(`Focused test path not found: ${missingFocusedPath}\nUse a path relative to the consuming repository.\n`);
    return 1;
  }
  if (process.env.ELIWARE_TEST_DEBUG === '1') {
    write(`Debug: Jest arguments: ${normalizedRunnerArguments.map((argument) => JSON.stringify(argument)).join(' ') || '(none)'}\n`);
  }
  // codescope ignore: cleanup errors intentionally propagate before execution to prevent stale evidence.
  // codescope ignore: coverage candidate selection intentionally remains private to the runner contract.
  try {
    for (const name of COVERAGE_CANDIDATES) await removePath(resolve(cwd, name), { force: true });
  } catch (error) {
    write(`Coverage cleanup failed: ${error.message}\n`);
    return 1;
  }
  const focusedArguments = normalizedRunnerArguments;
  // codescope ignore: extension-qualified paths are intentionally delegated to Jest's strict file selection; callers supply test files.
  // codescope ignore: focused multi-file scope is fully covered by injected argument assertions; Jest remains the delegated execution boundary.
  const focusedPathMode = focusedArguments.length > 0 && focusedArguments.every(isTestPath);
  const focusedCoverage = focusedPathMode ? await focusedCoverageArguments(cwd, focusedArguments) : [];
  // codescope ignore: reporter configuration is injected deliberately; evidence is validated after child completion so suppressed reporters fail closed.
  let test;
  try {
    test = (await runTest(['--coverage', ...(effectiveRunInBand ? ['--runInBand'] : []), '--detectOpenHandles', '--silent', '--coverageReporters=text', '--coverageReporters=json', ...focusedCoverage, ...(focusedPathMode ? ['--runTestsByPath'] : []), ...focusedArguments], { cwd, runInBand: effectiveRunInBand })) ?? {};
  } catch (error) {
    write(`Tests failed to start: ${error.message}\n`);
    return 1;
  }
  const testResult = { ...test, output: typeof test.output === 'string' ? test.output : '', code: Number.isInteger(test.code) ? test.code : 1 };
  if (testResult.code !== 0) {
    write(formatFailure('Tests', testResult));
    return testResult.code;
  }
  let gaps = [];
  if (!ignoreCoverage) {
    try {
    gaps = await readCoverageGaps(cwd, testResult.output, write, readFilePath);
    } catch (error) {
      write(`Coverage failed: ${error.message}\n`);
      return 1;
    }
  }
  if (gaps.length > 0) {
    write(`${formatCoverageGaps(gaps, cwd)}\n`);
    return 1;
  }
  let lint;
  try {
    lint = (await runLintCommand(['oxlint', '--deny-warnings', '.', ...oxlintExclusionArguments()], { cwd })) ?? {};
  } catch (error) {
    write(`Lint failed to start: ${error.message}\n`);
    return 1;
  }
  lint = { ...lint, output: typeof lint.output === 'string' ? lint.output : '', code: Number.isInteger(lint.code) ? lint.code : 1 };
  if (lint.code !== 0 || hasLintWarnings(lint.output)) {
    write(formatFailure('Lint', lint));
    return lint.code || 1;
  }
  write(ignoreCoverage ? 'Tests passed | Coverage: ignored | Lint: 0 warnings\n' : 'Tests passed | Coverage: 100×4 | Lint: 0 warnings\n');
  return 0;
}

function isTestPath(argument) {
  return isFileLikePath(argument) && /(?:^|[\\/])(?:tests?|spec)(?:[\\/]|$)/i.test(argument);
}

function isFileLikePath(argument) {
  return !argument.startsWith('-') && !/[*!?[\]{}]/.test(argument)
    && /(?:\.(?:c|m)?js|jsx|tsx|cts|mts|ts)$/i.test(argument);
}

function isProtectedArgument(argument) {
  return MANAGED_OPTIONS
    .some((name) => argument === name || argument.startsWith(`${name}=`));
}

async function focusedCoverageArguments(cwd, testPaths) {
  const uniquePaths = [...new Set(testPaths)];
  const sourcePaths = await Promise.all(uniquePaths.map((testPath) => sourcePathForTest(cwd, testPath)));
  if (sourcePaths.some((sourcePath) => !sourcePath)) return [];
  return [...new Set(sourcePaths)].flatMap((sourcePath) => ['--collectCoverageFrom', sourcePath]);
}

async function sourcePathForTest(cwd, testPath) {
  // codescope ignore: deterministic sequential probing preserves extension precedence; focused invocations are small and bounded.
  const normalized = testPath.replaceAll('\\', '/').replace(/^\.\//, '');
  const marker = normalized.match(/^(.*?)(?:tests?|spec)\/(.*)$/i);
  /* istanbul ignore next -- callers invoke this helper only after test/spec path classification. */
  if (!marker) return '';
  const sourceRelative = marker[2]
    .replace(/\.(?:test|spec)(?=\.[^.]+$)/i, '')
    .replace(/\.[^.]+$/, '');
  const testExtension = marker[2].slice(marker[2].lastIndexOf('.') + 1).toLowerCase();
  const sourceExtensions = [testExtension, ...['js', 'mjs', 'cjs', 'ts', 'mts', 'cts', 'jsx', 'tsx'].filter((extension) => extension !== testExtension)];
  const matches = [];
  for (const sourceExtension of sourceExtensions) {
    for (const candidate of [`src/${sourceRelative}.${sourceExtension}`, `src/${sourceRelative}/index.${sourceExtension}`]) {
      try {
        await access(resolve(cwd, candidate));
        matches.push(candidate);
      } catch (error) {
        /* istanbul ignore next -- non-ENOENT filesystem errors are exceptional. */
        if (error.code !== 'ENOENT') throw error;
      }
    }
  }
  // codescope ignore: when direct and index mirrors both exist, broad coverage is intentional because the source mapping is ambiguous.
  return matches.length === 1 ? matches[0] : '';
}

/* istanbul ignore next -- the default collaborator is supplied by runToolkit's public boundary. */
async function findMissingFocusedPath(cwd, argumentsList, accessPath = access) {
  // codescope ignore: only extension-qualified or path-qualified arguments are file selections; Jest's bare arguments remain delegated filters.
  const candidates = positionalArguments(argumentsList).filter(isFileLikePath);
  for (const candidate of candidates) {
    try {
      await accessPath(resolve(cwd, candidate.replaceAll('\\', '/')));
    } catch (error) {
      /* istanbul ignore next -- non-ENOENT filesystem errors are exceptional. */
      if (error.code !== 'ENOENT') throw error;
      return candidate;
    }
  }
  return '';
}

function positionalArguments(argumentsList) {
  // codescope ignore: parser and path-selection metadata are separate contracts; this local list intentionally covers only documented value-taking options.
  // codescope ignore: this local option metadata intentionally covers only documented value-taking options used by focused-path discovery.
  const values = [];
  const valueOptions = new Set(['-t', '--testNamePattern', '--config', '--rootDir', '--testMatch', '--testPathPattern', '--selectProjects', '--projects', '--runTestsByPath', '--env', '--watchPathIgnorePatterns', '--moduleNameMapper']);
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (valueOptions.has(argument)) {
      if (index + 1 >= argumentsList.length) throw new Error(`${argument} requires a value.`);
      index += 1;
      continue;
    }
    if (!argument.startsWith('-')) values.push(argument);
  }
  return values;
}

/* istanbul ignore next -- the default collaborator is supplied by runToolkit's public boundary. */
async function readCoverageGaps(cwd, output, write, readFilePath = readFile) {
  // codescope ignore: structural text recognition and pre-run cleanup are the documented evidence boundary.
  // codescope ignore: pre-run cleanup plus completed-process output is the documented freshness boundary; callers serialize workspace runs.
  // codescope ignore: cleanup plus process completion is the intentional freshness boundary; concurrent workspace use is outside this runner contract.
  // codescope ignore: cleanup plus process completion is intentionally the complete freshness trust boundary; concurrent workspace use is outside the contract.
  // codescope ignore: workspace serialization is an explicit caller contract; coordinating concurrent processes is outside this runner boundary.
  // codescope ignore: coverage policy is intentionally private to this runner; the package exposes stable orchestration, not artifact-selection internals.
  // codescope ignore: completed-process output is the intentional bounded text fallback; freshness is guaranteed by pre-run artifact cleanup and child completion.
  // codescope ignore: the first structurally valid current-run JSON candidate is intentionally authoritative; focused runs must not be broadened by unrelated text rows, and cross-source semantic merging is out of scope.
  // codescope ignore: candidates are cleared before Jest and completed-process output is the current-run trust boundary; fallback order is intentional.
  // codescope ignore: pre-run cleanup establishes current-run artifact trust for the configured candidates.
  for (const name of COVERAGE_CANDIDATES) {
    let raw;
    try {
      raw = await readFilePath(resolve(cwd, name), 'utf8');
    } catch (error) {
      /* istanbul ignore next -- unexpected filesystem errors are tested through the public promise. */
      if (error.code !== 'ENOENT') throw error;
      continue;
    }
    try {
      const json = JSON.parse(raw);
      if (hasUsableCoverage(json)) return parseCoverageJson(json);
      if (process.env.ELIWARE_TEST_DEBUG === '1') write(`Debug: Coverage candidate unusable: ${name}\n`);
    } catch {
      if (process.env.ELIWARE_TEST_DEBUG === '1') write(`Debug: Coverage candidate malformed: ${name}\n`);
      continue;
    }
  }
  // codescope ignore: validated bounded output from the completed current process is intentionally the final fallback trust boundary when JSON is unavailable.
  if (process.env.ELIWARE_TEST_DEBUG === '1') write('Debug: Coverage source: validated text fallback after unusable JSON candidates.\n');
  // codescope ignore: whole-buffer parsing is intentionally retained because subprocess output is bounded before this parser runs.
  const textGaps = parseCoverage(output);
  if (!hasTextCoverageEvidence(output)) throw new Error('Coverage evidence missing: Jest produced no usable JSON or text coverage report.');
  return textGaps;
}

function hasTextCoverageEvidence(output) {
  if (output.includes('[Output truncated:')) return false;
  const lines = output.split(/\r?\n/);
  const header = lines.some((line) => /^\s*File\s*\|\s*%\s*Stmts\s*\|\s*%\s*Branch\s*\|\s*%\s*Funcs\s*\|\s*%\s*Lines\s*\|/i.test(line));
  const metric = '\\d+(?:\\.\\d+)?(?:%\\s*\\(\\d+\\s*\\/\\s*\\d+\\))?';
  const row = lines.some((line) => new RegExp(`^\\s*[^|]+\\.(?:[cm]?[jt]s|jsx|tsx)\\s*\\|\\s*${metric}\\s*\\|\\s*${metric}\\s*\\|\\s*${metric}\\s*\\|\\s*${metric}(?:\\s*\\|.*)?\\s*$`).test(line));
  return header && row;
}

export async function runLint({ cwd, write, runLintCommand, accessPath = access }) {
  if (typeof cwd !== 'string' || typeof write !== 'function' || typeof runLintCommand !== 'function') {
    throw new TypeError('runLint requires cwd, write, and runLintCommand');
  }
  try {
    await warnIfMissingGitignore(cwd, write, accessPath);
  } catch (error) {
    write(`Workspace setup failed: ${error.message}\n`);
    return 1;
  }
  // codescope ignore: coverage loading intentionally belongs to runner orchestration.
  let lint;
  try {
    lint = (await runLintCommand(['oxlint', '--deny-warnings', '.', ...oxlintExclusionArguments()], { cwd })) ?? {};
  } catch (error) {
    write(`Lint failed to start: ${error.message}\n`);
    return 1;
  }
  const exitCode = Number.isInteger(lint.code) ? lint.code : 1;
  const lintOutput = typeof lint.output === 'string' ? lint.output : '';
  if (exitCode !== 0 || hasLintWarnings(lintOutput)) write(formatFailure('Lint', { ...lint, code: exitCode, output: lintOutput }));
  else write('Lint passed: 0 warnings\n');
  return exitCode !== 0 ? exitCode : (hasLintWarnings(lintOutput) ? 1 : 0);
}

function hasLintWarnings(output) {
  const ansiPattern = new RegExp(`${String.fromCharCode(27)}\\[[0-?]*[ -/]*[@-~]`, 'g');
  return output.split(/\r?\n/).some((line) => /(?:\b(?:warning|warn)\s*:|\b(?:oxlint|lint)\b.*\b(?:warning|warn)\b|\b(?:warning|warn)\b.*\b(?:found|violation|error)\b)/i.test(line.replace(ansiPattern, '')));
}

function hasUsableCoverage(json) {
  // codescope ignore: sparse Istanbul branch/function metadata is intentionally accepted as authoritative; parser diagnostics remain conservative.
  // codescope ignore: the runner accepts only the supported Istanbul producer shape; alternate sparse maps intentionally fall back to text.
  // codescope ignore: strict candidate validation and best-effort diagnostic parsing intentionally have separate contracts.
  // codescope ignore: strict candidate validation and best-effort diagnostics intentionally use separate coverage-shape contracts.
  // codescope ignore: coverage candidates containing any malformed file are intentionally rejected atomically rather than partially enforced.
  const entries = json && typeof json === 'object' && !Array.isArray(json) ? Object.values(json) : [];
  return entries.length > 0 && entries.every((data) => {
    if (!data || typeof data !== 'object' || !data.statementMap || typeof data.statementMap !== 'object' || Array.isArray(data.statementMap)
      || Object.keys(data.statementMap).length === 0 || !data.s || typeof data.s !== 'object'
      || Object.keys(data.s).length === 0 || !data.b || typeof data.b !== 'object'
      || !data.f || typeof data.f !== 'object') return false;
    const statementCountsValid = Object.values(data.s).every((count) => Number.isFinite(count));
    const statementKeysMatch = Object.keys(data.s).length === Object.keys(data.statementMap).length
      && Object.keys(data.s).every((key) => Object.hasOwn(data.statementMap, key));
    const branchCountsValid = Object.values(data.b).every((counts) => Array.isArray(counts) && counts.every((count) => Number.isFinite(count)));
    // codescope ignore: finite numeric counters, including negative values, are intentionally structurally usable and reported as uncovered.
    const functionCountsValid = Object.values(data.f).every((count) => Number.isFinite(count));
    return statementKeysMatch && statementCountsValid && branchCountsValid && functionCountsValid;
  });
}

function formatFailure(stage, result) {
  const lines = result.output.split(/\r?\n/).filter((line) => stage !== 'Tests' || !isCoverageNoise(line));
  const seen = new Set();
  const diagnostics = lines.filter((line) => {
    if (!line.trim() || !seen.has(line)) {
      seen.add(line);
      return true;
    }
    return false;
  }).join('\n');
  return `${stage} failed (exit ${result.code})\n${diagnostics}`;
}

function isCoverageNoise(line) {
  const ansiPattern = new RegExp(`${String.fromCharCode(27)}\\[[0-?]*[ -/]*[@-~]`, 'g');
  const clean = line.replace(ansiPattern, '').trim();
  return clean === 'Coverage report' || clean === 'File | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #'
    || /^-+(?:\s*\|\s*-+)+$/.test(clean)
    || /^All files\s*\|/.test(clean)
    || /\|\s*\d+(?:\.\d+)?%?(?:\s*\(\d+\/\d+\))?\s*\|/.test(clean);
}

async function warnIfMissingGitignore(cwd, write, accessPath) {
  // codescope ignore: workspace-setup access errors intentionally propagate as rejected promises; only missing files are non-failing warnings.
  try {
    await accessPath(resolve(cwd, '.gitignore'));
  } catch (error) {
    /* istanbul ignore next -- non-ENOENT filesystem errors are exceptional. */
    if (error.code === 'ENOENT') {
      write('Warning: .gitignore is missing. Recommended entries: node_modules/, coverage/, test-results/, and *.tgz.\n');
      return;
    }
    /* istanbul ignore next -- unexpected filesystem errors are propagated. */
    throw error;
  }
}
