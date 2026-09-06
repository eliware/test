import { normalizeCoveragePath } from './normalize-path.mjs';

const MAX_COVERAGE_DETAILS = 20;
function location(entry) { return entry?.start?.line ? `${entry.start.line}${entry.start.column ? `:${entry.start.column}` : ''}` : entry?.unknown ? 'unknown (metadata missing)' : 'unknown'; }
function details(items, formatter) { const visibleItems = Array.isArray(items) ? items : []; const visible = visibleItems.slice(0, MAX_COVERAGE_DETAILS).map(formatter).join(', ') || '-'; const omitted = visibleItems.length - MAX_COVERAGE_DETAILS; return omitted > 0 ? `${visible} (+${omitted} more omitted)` : visible; }

/** Format one structured coverage gap. */
export function formatStructuredGap(gap, root = '') {
  const file = normalizeCoveragePath(gap?.file, root);
  const metrics = gap.metrics ?? { statements: '-', branches: '-', functions: '-', lines: '-' };
  return [`${file} | ${metrics.statements}% | ${metrics.branches}% | ${metrics.functions}% | ${metrics.lines}% | uncovered lines: ${(Array.isArray(gap.lines) ? gap.lines : []).join(', ') || '-'}`, `  Uncovered statements: ${details(gap.statements, location)}`, `  Uncovered branches: ${details(gap.branches, (entry) => `${location(entry)} (${entry.type ?? 'branch'}, uncovered)`)}`, `  Uncovered functions: ${details(gap.functions, (fn) => `${fn?.name ?? 'anonymous'} at ${location(fn)}`)}`, '  Fix: add or extend tests that execute each listed statement, branch, and function path.'].join('\n');
}

/** Format a legacy metric-array coverage gap. */
export function formatLegacyGap(gap, root = '') { return `${normalizeCoveragePath(gap?.file, root)} | ${gap.metrics.join(' | ')}`; }
