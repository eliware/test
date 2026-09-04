import { normalizeCoveragePath } from './normalize-path.mjs';

const MAX_COVERAGE_DETAILS = 20;
export function formatCoverageGaps(gaps, root = '') {
  const entries = Array.isArray(gaps) ? gaps : [];
  if (entries.length === 0) return '';
  return ['Coverage gaps:', 'File | Statements | Branches | Functions | Lines', ...entries.map((gap) => {
    const file = normalizeCoveragePath(gap?.file, root);
    if (Array.isArray(gap.metrics)) return `${file} | ${gap.metrics.join(' | ')}`;
    const location = (entry) => entry?.start?.line ? `${entry.start.line}${entry.start.column ? `:${entry.start.column}` : ''}` : entry?.unknown ? 'unknown (metadata missing)' : 'unknown';
    const metrics = gap.metrics ?? { statements: '-', branches: '-', functions: '-', lines: '-' };
    const details = (items, formatter) => { items = Array.isArray(items) ? items : []; const visible = items.slice(0, MAX_COVERAGE_DETAILS).map(formatter).join(', ') || '-'; const omitted = items.length - MAX_COVERAGE_DETAILS; return omitted > 0 ? `${visible} (+${omitted} more omitted)` : visible; };
    return [`${file} | ${metrics.statements}% | ${metrics.branches}% | ${metrics.functions}% | ${metrics.lines}% | uncovered lines: ${(Array.isArray(gap.lines) ? gap.lines : []).join(', ') || '-'}`, `  Uncovered statements: ${details(gap.statements, location)}`, `  Uncovered branches: ${details(gap.branches, (entry) => `${location(entry)} (${entry.type ?? 'branch'}, uncovered)`)}`, `  Uncovered functions: ${details(gap.functions, (fn) => `${fn?.name ?? 'anonymous'} at ${location(fn)}`)}`, '  Fix: add or extend tests that execute each listed statement, branch, and function path.'].join('\n');
  }), '', 'Remediation: Add tests to improve coverage. Refactor the implementation if necessary to ensure proper testability. Remove any truly unreachable branches. Istanbul ignore directives are authorized only in pure barrel files.'].join('\n');
}

export function formatGaps(gaps, root = '') {
  if (!Array.isArray(gaps)) throw new TypeError('formatGaps requires an array of coverage gaps');
  return formatCoverageGaps(gaps, root);
}
