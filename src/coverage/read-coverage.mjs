import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseJsonReport } from './parse-json-report.mjs';
import { parseTextReport } from './parse-text-report.mjs';
import { selectUsableReport } from './select-usable-report.mjs';
import { hasTextCoverageEvidence } from './text-evidence.mjs';
import { isUsableCoverageReport } from './is-usable-coverage-report.mjs';
import { debugOutput } from '../diagnostics/debug-output.mjs';

export const COVERAGE_CANDIDATES = ['coverage/coverage-final.json', 'coverage/coverage.json', 'coverage.json'];

export async function readCoverage(cwd, testOutput, write, readFilePath = readFile, statPath = stat, startedAt = 0) {
  if (typeof cwd !== 'string') throw new TypeError('readCoverage requires cwd');
  if (typeof testOutput !== 'string') throw new TypeError('readCoverage requires test output');
  for (const name of COVERAGE_CANDIDATES) {
    try {
      const reportPath = resolve(cwd, name);
      const json = JSON.parse(await readFilePath(reportPath, 'utf8'));
      let fresh = true;
      if (startedAt) {
        try { fresh = (await statPath(reportPath)).mtimeMs >= startedAt; }
        catch (error) { if (error.code !== 'ENOENT') throw error; }
      }
      if (fresh && selectUsableReport([{ usable: isUsableCoverageReport(json), report: json }])) return parseJsonReport(json);
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
  debugOutput(write, 'Coverage fallback', 'using Jest text coverage');
  return gaps;
}

export function hasUsableCoverage(json) {
  return isUsableCoverageReport(json);
}
