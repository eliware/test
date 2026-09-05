import { readFile, stat } from 'node:fs/promises';
import { readCoverageReports, COVERAGE_CANDIDATES } from './read-coverage-reports.mjs';
import { resolveCoverageEvidence } from './resolve-coverage-evidence.mjs';
import { isUsableCoverageReport } from './is-usable-coverage-report.mjs';

export { COVERAGE_CANDIDATES };

export async function readCoverage(cwd, testOutput, write, readFilePath = readFile, statPath = stat, startedAt = 0) {
  if (typeof cwd !== 'string') throw new TypeError('readCoverage requires cwd');
  if (typeof testOutput !== 'string') throw new TypeError('readCoverage requires test output');
  const reports = await readCoverageReports(cwd, readFilePath, statPath, startedAt);
  return resolveCoverageEvidence(reports, testOutput, write, startedAt);
}

export function hasUsableCoverage(json) {
  return isUsableCoverageReport(json);
}
