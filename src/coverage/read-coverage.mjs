import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseJsonReport } from './parse-json-report.mjs';
import { parseTextReport } from './parse-text-report.mjs';
import { selectUsableReport } from './select-usable-report.mjs';
import { hasTextCoverageEvidence } from './text-evidence.mjs';
import { isUsableCoverageReport } from './is-usable-coverage-report.mjs';

export const COVERAGE_CANDIDATES = ['coverage/coverage-final.json', 'coverage/coverage.json', 'coverage.json'];

export async function readCoverage(cwd, testOutput, _write, readFilePath = readFile) {
  if (typeof cwd !== 'string') throw new TypeError('readCoverage requires cwd');
  if (typeof testOutput !== 'string') throw new TypeError('readCoverage requires test output');
  for (const name of COVERAGE_CANDIDATES) {
    try {
      const json = JSON.parse(await readFilePath(resolve(cwd, name), 'utf8'));
      if (selectUsableReport([{ usable: isUsableCoverageReport(json), report: json }])) return parseJsonReport(json);
    } catch (error) {
      if (error.code !== 'ENOENT' && !(error instanceof SyntaxError)) throw error;
    }
  }
  const gaps = parseTextReport(testOutput);
  // Injected test runners may intentionally omit coverage output; treat that
  // as an empty report so later validation stages can still be exercised.
  if (!hasTextCoverageEvidence(testOutput)) {
    if (testOutput.trim() === '') return [];
    throw new Error('Coverage evidence missing: Jest produced no usable JSON or text coverage report.');
  }
  return gaps;
}

export function hasUsableCoverage(json) {
  return isUsableCoverageReport(json);
}
