import { formatCoverageGaps, parseCoverage, parseCoverageJson } from './coverage.mjs';
import { MANAGED_OPTIONS, VALUE_OPTIONS } from './arguments.mjs';
import { access, open, readFile, rm, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { oxlintExclusionArguments } from './workspace.mjs';
import { findIstanbulIgnoreViolations, isPureBarrelFile } from './istanbul.mjs';
import { EXIT_CODES } from './exit-codes.mjs';

const COVERAGE_CANDIDATES = ['coverage/coverage-final.json', 'coverage/coverage.json', 'coverage.json'];

export async function runToolkit(options) {
  if (typeof options?.cwd !== 'string' || typeof options.write !== 'function') throw new TypeError('runToolkit requires cwd and write');
  if (options.lock === false) return runToolkitUnlocked(options);
  const lockPath = resolve(options.cwd, '.eliware-test.lock');
  let lock;
  try {
    lock = await open(lockPath, 'wx');
  } catch (error) {
    if (error.code === 'EEXIST') {
      options.write('Validation already running for this workspace; serialize invocations.\n');
      return EXIT_CODES.WORKSPACE_SETUP;
    }
    throw error;
  }
  try {
    return await runToolkitUnlocked(options);
  } finally {
    await lock.close();
    await unlink(lockPath).catch(() => undefined);
  }
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
  return matches.length === 1 ? matches[0] : '';
}

async function findMissingFocusedPath(cwd, argumentsList, accessPath = access) {
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
  if (process.env.ELIWARE_TEST_DEBUG === '1') write('Debug: Coverage source: validated text fallback after unusable JSON candidates.\n');
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
