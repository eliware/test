import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseJsonReport } from './parse-json-report.mjs';
import { parseTextReport } from './parse-text-report.mjs';
import { hasTextCoverageEvidence } from './text-evidence.mjs';
import { isUsableCoverageReport } from './is-usable-coverage-report.mjs';
import { debugOutput } from '../diagnostics/debug-output.mjs';

export const COVERAGE_CANDIDATES = ['coverage/coverage-final.json', 'coverage/coverage.json', 'coverage.json'];

async function readStableReport(reportPath, readFilePath, statPath, startedAt) {
  let before = null;
  if (startedAt) {
    try { before = await statPath(reportPath); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  const first = await readFilePath(reportPath, 'utf8');
  const firstAfter = startedAt ? await statPath(reportPath) : null;
  const second = startedAt ? await readFilePath(reportPath, 'utf8') : first;
  const after = startedAt ? await statPath(reportPath) : null;
  const identityChanged = firstAfter && after && firstAfter.dev !== undefined && after.dev !== undefined
    && firstAfter.ino !== undefined && after.ino !== undefined
    && (firstAfter.dev !== after.dev || firstAfter.ino !== after.ino);
  if (startedAt && (first !== second || (firstAfter && after && firstAfter.mtimeMs !== after.mtimeMs) || identityChanged)) return null;
  const fresh = !startedAt || (before ? firstAfter.mtimeMs === after.mtimeMs && after.mtimeMs >= startedAt : after.mtimeMs >= startedAt);
  return { contents: second, fresh };
}

export async function readCoverage(cwd, testOutput, write, readFilePath = readFile, statPath = stat, startedAt = 0) {
  if (typeof cwd !== 'string') throw new TypeError('readCoverage requires cwd');
  if (typeof testOutput !== 'string') throw new TypeError('readCoverage requires test output');
  const reports = [];
  for (const name of COVERAGE_CANDIDATES) {
    reports.push(await (async () => {
    try {
      const reportPath = resolve(cwd, name);
      const snapshot = await readStableReport(reportPath, readFilePath, statPath, startedAt);
      if (!snapshot) return { name };
      const json = JSON.parse(snapshot.contents);
      const { fresh } = snapshot;
      const usable = isUsableCoverageReport(json);
      return { name, json, usable, malformed: !usable, fresh };
    } catch (error) {
      if (error instanceof SyntaxError) return { name, malformed: true };
      if (error.code === 'ENOENT') return { name };
      throw error;
    }
    })());
  }
  const selected = reports.find(({ usable, fresh }) => fresh && usable);
  if (selected) return parseJsonReport(selected.json);
  const malformedReport = reports.find(({ malformed }) => malformed)?.name;
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
