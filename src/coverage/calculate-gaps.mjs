import { meetsCoverageThresholds } from './coverage-thresholds.mjs';

/** Return coverage entries that fail any required metric. */
export function calculateGaps(entries) {
  if (!Array.isArray(entries)) return [];
  return entries.filter((entry) => !meetsCoverageThresholds(entry?.metrics));
}
