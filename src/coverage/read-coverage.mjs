import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseJsonReport } from './parse-json-report.mjs';
import { parseTextReport } from './parse-text-report.mjs';
import { hasTextCoverageEvidence } from './text-evidence.mjs';
import { isUsableCoverageReport } from './is-usable-coverage-report.mjs';
import { debugOutput } from '../diagnostics/debug-output.mjs';

export const COVERAGE_CANDIDATES = ['coverage/coverage-final.json', 'coverage/coverage.json', 'coverage.json'];

export async function readCoverage(cwd, testOutput, write, readFilePath = readFile, statPath = stat, startedAt = 0) {
  if (typeof cwd !== 'string') throw new TypeError('readCoverage requires cwd');
  if (typeof testOutput !== 'string') throw new TypeError('readCoverage requires test output');
  const reports = await Promise.all(COVERAGE_CANDIDATES.map(async (name) => {
    try {
      const reportPath = resolve(cwd, name);
      let before = null;
      let fresh = true;
      if (startedAt) {
        try { before = await statPath(reportPath); }
        catch (error) { if (error.code !== 'ENOENT') throw error; }
      }
      const json = JSON.parse(await readFilePath(reportPath, 'utf8'));
      if (startedAt) {
        const after = await statPath(reportPath);
        fresh = before ? before.mtimeMs === after.mtimeMs && after.mtimeMs >= startedAt : after.mtimeMs >= startedAt;
      }
      const usable = isUsableCoverageReport(json);
      return { name, json, usable, malformed: !usable, fresh };
    } catch (error) {
      if (error instanceof SyntaxError) return { name, malformed: true };
      if (error.code === 'ENOENT') return { name };
      throw error;
    }
  }));
  const malformedReport = reports.find(({ malformed }) => malformed)?.name;
  const selected = reports.find(({ usable, fresh }) => fresh && usable);
  if (selected) return parseJsonReport(selected.json);
  const gaps = parseTextReport(testOutput);
  if (!hasTextCoverageEvidence(testOutput)) {
    if (malformedReport) throw new Error(`Coverage report is malformed: ${malformedReport}. Rerun the tests to regenerate coverage data.`);
    throw new Error('Coverage evidence missing: Jest produced no usable JSON or text coverage report.');
  }
  debugOutput(write, 'Coverage fallback', 'using Jest text coverage');
  return gaps;
}

export function hasUsableCoverage(json) {
  return isUsableCoverageReport(json);
}
