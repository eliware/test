import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { isUsableCoverageReport } from './is-usable-coverage-report.mjs';
import { readStableReport } from './read-stable-report.mjs';

export const COVERAGE_CANDIDATES = ['coverage/coverage-final.json', 'coverage/coverage.json', 'coverage.json'];

export async function readCoverageReports(cwd, readFilePath = readFile, statPath = stat, startedAt = 0, candidates = COVERAGE_CANDIDATES) {
  const reports = [];
  for (const name of candidates) {
    try {
      const snapshot = await readStableReport(resolve(cwd, name), readFilePath, statPath, startedAt);
      if (!snapshot) { reports.push({ name }); continue; }
      if (snapshot.contents.trim() === '') { reports.push({ name, fresh: snapshot.fresh, freshnessAvailable: snapshot.freshnessAvailable }); continue; }
      const json = JSON.parse(snapshot.contents);
      const usable = isUsableCoverageReport(json);
      reports.push({ name, json, usable, malformed: !usable, fresh: snapshot.fresh, freshnessAvailable: snapshot.freshnessAvailable });
      if (usable && snapshot.fresh) break;
    } catch (error) {
      if (error instanceof SyntaxError) reports.push({ name, malformed: true, fresh: true, freshnessAvailable: true });
      else if (error.code !== 'ENOENT') throw error;
      else reports.push({ name });
    }
  }
  return reports;
}
