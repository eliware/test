import { formatMonolithViolations } from '../diagnostics/format-monolith-violations.mjs';

/** Preserve the monolith-domain formatter under its domain-oriented name. */
export function formatViolations(violations) {
  if (!Array.isArray(violations)) {
    throw new TypeError('formatViolations requires an array');
  }
  return formatMonolithViolations(violations);
}
