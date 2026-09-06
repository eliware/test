import { formatLegacyGap, formatStructuredGap } from './format-gap-entry.mjs';
export function formatCoverageGaps(gaps, root = '') {
  const entries = Array.isArray(gaps) ? gaps : [];
  if (entries.length === 0) return '';
  return ['Coverage gaps:', 'File | Statements | Branches | Functions | Lines', ...entries.map((gap) => {
    if (Array.isArray(gap.metrics)) return formatLegacyGap(gap, root);
    return formatStructuredGap(gap, root);
  }), '', 'Remediation: Add tests to improve coverage. Refactor the implementation if necessary to ensure proper testability. Remove any truly unreachable branches. Istanbul ignore directives are authorized only in pure barrel files.'].join('\n');
}

export function formatGaps(gaps, root = '') {
  if (!Array.isArray(gaps)) throw new TypeError('formatGaps requires an array of coverage gaps');
  return formatCoverageGaps(gaps, root);
}
