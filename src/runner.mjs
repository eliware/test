import { formatCoverageGaps, parseCoverage, parseCoverageJson } from './coverage.mjs';
import { readFile } from 'node:fs/promises';
import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';

export async function runToolkit({ cwd, runnerArguments, write, runTest, runLintCommand }) {
  await rm(resolve(cwd, 'coverage/coverage-final.json'), { force: true });
  await rm(resolve(cwd, 'coverage/coverage.json'), { force: true });
  await rm(resolve(cwd, 'coverage.json'), { force: true });
  const test = await runTest(['--coverage', '--runInBand', '--detectOpenHandles', '--silent', '--coverageReporters=text', '--coverageReporters=json', ...runnerArguments], { cwd });
  if (test.code !== 0) {
    write(`Tests failed (exit ${test.code})\n${test.output}`);
    return test.code;
  }
  const gaps = await readCoverageGaps(cwd, test.output);
  if (gaps.length > 0) {
    write(`${formatCoverageGaps(gaps)}\n`);
    return 1;
  }
  const lint = await runLintCommand(['oxlint', '.'], { cwd });
  if (lint.code !== 0) {
    write(`Lint failed (exit ${lint.code})\n${lint.output}`);
    return lint.code;
  }
  write('All files | 100 | 100 | 100 | 100 |\nTests passed | Coverage: 100×4 | Lint: 0 warnings\n');
  return 0;
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
  const lint = await runLintCommand(['oxlint', '.'], { cwd });
  if (lint.code !== 0) write(`Lint failed (exit ${lint.code})\n${lint.output}`);
  else write('Lint passed: 0 warnings\n');
  return lint.code;
}
