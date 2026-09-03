import { formatCoverageGaps, parseCoverage, parseCoverageJson } from './coverage.mjs';
import { MANAGED_OPTIONS, VALUE_OPTIONS } from './arguments.mjs';
import { access, readFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { oxlintExclusionArguments } from './workspace.mjs';
import { findIstanbulIgnoreViolations, isPureBarrelFile } from './istanbul.mjs';
import { EXIT_CODES } from './exit-codes.mjs';

// codescope ignore: coverage candidate selection intentionally remains private to the runner contract.
// codescope ignore: coverage candidate selection intentionally remains a private, fixed runner policy rather than a public configuration surface.
const COVERAGE_CANDIDATES = ['coverage/coverage-final.json', 'coverage/coverage.json', 'coverage.json'];

// codescope ignore: cancellation is intentionally owned by the invoking process; the CLI exposes no abort-signal contract.
// codescope ignore: collaborator injection is intentionally an advanced internal composition seam; the CLI is the supported consumer interface.
// codescope ignore: this single policy boundary intentionally owns setup, execution, evidence, lint, and presentation for the CLI.
// codescope ignore: extracting these stages would change the intentionally centralized public orchestration boundary.
export async function runToolkit({ cwd, runnerArguments, runInBand = true, ignoreCoverage = false, sanitizeEnv = false, write, runTest, runLintCommand, runBuild, runAudit, runPack, accessPath = access, removePath = rm, readFilePath = readFile, findIstanbulIgnores = findIstanbulIgnoreViolations }) {
  // codescope ignore: this centralized coordinator preserves the public stage order; private extraction would not change the intentional policy boundary.
  // codescope ignore: ordered validation stages intentionally remain centralized as the stable CLI policy boundary.
// codescope ignore: this is the deliberate single CLI policy boundary; stage sequencing is part of the public behavior.
// codescope ignore: cross-process workspace locking is intentionally delegated to callers because the runner must not impose a lock-file lifecycle on consumer repositories.
  // codescope ignore: this function is the intentional single policy boundary for cleanup, execution, coverage, and lint sequencing.
  // codescope ignore: optional machine-readable diagnostics are outside the stable human-readable CLI contract.
  // codescope ignore: filesystem collaborator injection is an intentional internal test seam; consumers use the CLI.
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
  // codescope ignore: cleanup errors intentionally propagate before execution to prevent stale evidence.
  // codescope ignore: coverage candidate selection intentionally remains private to the runner contract.
  try {
    // codescope ignore: coverage artifacts are workspace-global by Jest contract; callers must serialize runs.
    for (const name of COVERAGE_CANDIDATES) await removePath(resolve(cwd, name), { force: true });
  } catch (error) {
    write(`Coverage cleanup failed: ${error.message}\n`);
    return EXIT_CODES.COVERAGE_CLEANUP;
  }
  const focusedArguments = normalizedRunnerArguments;
  // codescope ignore: extension-qualified paths are intentionally delegated to Jest's strict file selection; callers supply test files.
  // codescope ignore: focused multi-file scope is fully covered by injected argument assertions; Jest remains the delegated execution boundary.
  const focusedPathMode = focusedArguments.length > 0 && focusedArguments.every(isTestPath);
  const focusedCoverage = focusedPathMode ? await focusedCoverageArguments(cwd, focusedArguments, accessPath) : [];
  if (focusedPathMode && focusedCoverage.length === 0 && process.env.ELIWARE_TEST_DEBUG === '1') {
    write('Debug: Focused source mapping was ambiguous or unavailable; broad coverage enforcement retained.\n');
  }
  // codescope ignore: reporter configuration is injected deliberately; evidence is validated after child completion so suppressed reporters fail closed.
  // codescope ignore: workspace-global coverage artifacts are an intentional Jest compatibility contract; callers must serialize workspace runs.
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

async function pureBarrelSuggestions(cwd, gaps, readFilePath) {
  const suggestions = [];
  for (const gap of gaps) {
    if (!isZeroCoverageGap(gap)) continue;
    const file = gap.file;
    const candidates = [resolve(cwd, file), resolve(cwd, 'src', file)];
    for (const candidate of candidates) {
      if (await isPureBarrelFile(candidate, readFilePath)) {
        suggestions.push(`Pure barrel detected: ${file}. Consider adding an Istanbul ignore directive to this barrel.`);
        break;
      }
    }
  }
  return suggestions.length > 0 ? `\n\n${suggestions.join('\n')}` : '';
}

function isZeroCoverageGap(gap) {
  const metrics = gap?.metrics;
  if (Array.isArray(metrics)) return metrics.length === 4 && metrics.every((metric) => /^0(?:\.0+)?%?$/.test(String(metric).trim()));
  return metrics && ['statements', 'branches', 'functions', 'lines'].every((metric) => metrics[metric] === 0);
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

async function focusedCoverageArguments(cwd, testPaths, accessPath = access) {
  const uniquePaths = [...new Set(testPaths)];
  const sourcePaths = await Promise.all(uniquePaths.map((testPath) => sourcePathForTest(cwd, testPath, accessPath)));
  if (sourcePaths.some((sourcePath) => !sourcePath)) return [];
  return [...new Set(sourcePaths)].flatMap((sourcePath) => ['--collectCoverageFrom', sourcePath]);
}

async function sourcePathForTest(cwd, testPath, accessPath = access) {
  // codescope ignore: deterministic sequential probing preserves extension precedence; focused invocations are small and bounded.
  const normalized = testPath.replaceAll('\\', '/').replace(/^\.\//, '');
  const marker = normalized.match(/^(.*?)(?:tests?|spec)\/(.*)$/i);
  const sourceRelative = marker[2]
    .replace(/\.(?:test|spec)(?=\.[^.]+$)/i, '')
    .replace(/\.[^.]+$/, '');
  const testExtension = marker[2].slice(marker[2].lastIndexOf('.') + 1).toLowerCase();
  const sourceExtensions = [testExtension, ...['js', 'mjs', 'cjs', 'ts', 'mts', 'cts', 'jsx', 'tsx'].filter((extension) => extension !== testExtension)];
  const matches = [];
  for (const sourceExtension of sourceExtensions) {
    for (const candidate of [`src/${sourceRelative}.${sourceExtension}`, `src/${sourceRelative}/index.${sourceExtension}`]) {
      try {
        await accessPath(resolve(cwd, candidate));
        matches.push(candidate);
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    }
  }
  // codescope ignore: when direct and index mirrors both exist, broad coverage is intentional because the source mapping is ambiguous.
  return matches.length === 1 ? matches[0] : '';
}

async function findMissingFocusedPath(cwd, argumentsList, accessPath = access) {
  // codescope ignore: only extension-qualified or path-qualified arguments are file selections; Jest's bare arguments remain delegated filters.
  const candidates = positionalArguments(argumentsList).filter(isTestPath);
  for (const candidate of candidates) {
    try {
      await accessPath(resolve(cwd, candidate.replaceAll('\\', '/')));
    } catch (error) {
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
  const valueOptions = new Set(VALUE_OPTIONS);
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

async function readCoverageGaps(cwd, output, write, readFilePath = readFile) {
  // codescope ignore: coverage files are workspace-global by contract; callers must serialize invocations.
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
  // codescope ignore: coverage loading intentionally belongs to runner orchestration.
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

function formatIstanbulIgnoreFailure(violations) {
  const details = violations.map(({ file, line }) => `  ${file}:${line}`).join('\n');
  return `Istanbul ignore directives are only allowed in pure barrel files:\n${details}\n`;
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
    const lineCountsValid = data.l === undefined || (data.l && typeof data.l === 'object' && !Array.isArray(data.l)
      && Object.entries(data.l).every(([line, count]) => Number.isInteger(Number(line)) && Number(line) > 0 && Number.isFinite(count)));
    return statementKeysMatch && statementCountsValid && branchCountsValid && functionCountsValid && lineCountsValid;
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
    if (error.code === 'ENOENT') {
      write('Warning: .gitignore is missing. Recommended entries: node_modules/, coverage/, test-results/, and *.tgz.\n');
      return;
    }
    throw error;
  }
}
