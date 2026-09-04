import { parseCoverageJson } from './coverage.mjs';
import { calculateGaps } from './calculate-gaps.mjs';

export function parseJsonReport(report) {
  if (!report || typeof report !== 'object' || Array.isArray(report)) throw new TypeError('parseJsonReport requires a coverage object');
  return calculateGaps(parseCoverageJson(report));
}
