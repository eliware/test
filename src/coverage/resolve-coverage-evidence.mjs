import { parseJsonReport } from './parse-json-report.mjs';
import { parseTextReport } from './parse-text-report.mjs';
import { hasTextCoverageEvidence } from './text-evidence.mjs';
import { debugOutput } from '../diagnostics/debug-output.mjs';

export function resolveCoverageEvidence(reports, testOutput, write, startedAt = 0) {
  const selected = reports.find(({ usable, fresh }) => fresh && usable);
  if (selected) return parseJsonReport(selected.json);
  if (startedAt && reports.some(({ freshnessAvailable }) => freshnessAvailable === false)) {
    throw new Error('Coverage freshness unavailable: could not verify that the JSON report belongs to the current test run.');
  }
  const malformedReport = reports.find(({ malformed, fresh }) => malformed && fresh)?.name;
  if (startedAt && malformedReport) throw new Error(`Coverage report is malformed: ${malformedReport}. Rerun the tests to regenerate coverage data.`);
  const gaps = parseTextReport(testOutput);
  if (!hasTextCoverageEvidence(testOutput)) {
    if (malformedReport) throw new Error(`Coverage report is malformed: ${malformedReport}. Rerun the tests to regenerate coverage data.`);
    throw new Error('Coverage evidence missing: Jest produced no usable JSON or text coverage report.');
  }
  debugOutput(write, 'Coverage fallback', 'using Jest text coverage');
  return gaps;
}
