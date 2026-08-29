import { formatCoverageGaps, parseCoverage, parseCoverageJson } from './coverage.mjs';
import { access, readFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { oxlintExclusionArguments } from './workspace.mjs';

export async function runToolkit({ cwd, runnerArguments, write, runTest, runLintCommand }) {
  await warnIfMissingGitignore(cwd, write);
  const missingFocusedPath = await findMissingFocusedPath(cwd, runnerArguments);
  if (missingFocusedPath) {
    write(`Focused test path not found: ${missingFocusedPath}\nUse a path relative to the consuming repository.\n`);
    return 1;
  }
  if (process.env.ELIWARE_TEST_DEBUG === '1') {
    write(`Debug: Jest arguments: ${runnerArguments.map((argument) => JSON.stringify(argument)).join(' ') || '(none)'}\n`);
  }
  await rm(resolve(cwd, 'coverage/coverage-final.json'), { force: true });
  await rm(resolve(cwd, 'coverage/coverage.json'), { force: true });
  await rm(resolve(cwd, 'coverage.json'), { force: true });
  const focusedPathMode = runnerArguments.length > 0 && runnerArguments.every(isTestPath);
  const test = await runTest(['--coverage', '--runInBand', '--detectOpenHandles', '--silent', '--coverageReporters=text', '--coverageReporters=json', ...(focusedPathMode ? ['--runTestsByPath'] : []), ...runnerArguments], { cwd });
  if (test.code !== 0) {
    write(formatFailure('Tests', test));
    return test.code;
  }
  const gaps = await readCoverageGaps(cwd, test.output);
  if (gaps.length > 0) {
    write(`${formatCoverageGaps(gaps, cwd)}\n`);
    return 1;
  }
  const lint = await runLintCommand(['oxlint', '.', ...oxlintExclusionArguments()], { cwd });
  if (lint.code !== 0) {
    write(formatFailure('Lint', lint));
    return lint.code;
  }
  write('All files | 100 | 100 | 100 | 100 |\nTests passed | Coverage: 100×4 | Lint: 0 warnings\n');
  return 0;
}

function isTestPath(argument) {
  return !argument.startsWith('-') && /(?:[\\/]tests?[\\/]|\.(?:c|m)?js)$/.test(argument);
}

async function findMissingFocusedPath(cwd, argumentsList) {
  const candidate = argumentsList.find((argument) =>
    !argument.startsWith('-') && (argument.includes('/') || argument.includes('\\') || /\.(?:c|m)?js$/.test(argument))
  );
  if (!candidate) return '';
  try {
    await access(resolve(cwd, candidate));
    return '';
  } catch (error) {
    /* istanbul ignore next -- non-ENOENT filesystem errors are exceptional. */
    if (error.code !== 'ENOENT') throw error;
    return candidate;
  }
}

async function readCoverageGaps(cwd, output) {
  for (const name of ['coverage/coverage-final.json', 'coverage/coverage.json', 'coverage.json']) {
    try {
      return parseCoverageJson(JSON.parse(await readFile(resolve(cwd, name), 'utf8')));
    } catch (error) {
      /* istanbul ignore next -- unexpected filesystem errors are tested through the public promise. */
      if (error.code !== 'ENOENT' && error.name !== 'SyntaxError') throw error;
    }
  }
  return parseCoverage(output);
}

export async function runLint({ cwd, write, runLintCommand }) {
  await warnIfMissingGitignore(cwd, write);
  const lint = await runLintCommand(['oxlint', '.', ...oxlintExclusionArguments()], { cwd });
  if (lint.code !== 0) write(formatFailure('Lint', lint));
  else write('Lint passed: 0 warnings\n');
  return lint.code;
}

function formatFailure(stage, result) {
  const lines = result.output.split(/\r?\n/);
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

async function warnIfMissingGitignore(cwd, write) {
  try {
    await access(resolve(cwd, '.gitignore'));
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
