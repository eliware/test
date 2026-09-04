/** Determine whether a JSON coverage object contains instrumented entries. */
import { isUsableCoverageEntry } from './is-usable-coverage-entry.mjs';

export function isUsableCoverageReport(json) {
  const entries = json && typeof json === 'object' && !Array.isArray(json) ? Object.values(json) : [];
  return entries.length > 0 && entries.every(isUsableCoverageEntry);
}
