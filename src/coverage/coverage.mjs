import { normalizeCoveragePath } from './normalize-path.mjs';
import { isCoveredCount, percentage, percentageWithUnknowns } from './percentages.mjs';
import { locationsForCounts } from './locations.mjs';
import { uncoveredBranches } from './branches.mjs';
import { uncoveredFunctions } from './functions.mjs';
export { percentageWithUnknowns } from './percentages.mjs';
export { parseCoverage } from './parse-text-coverage.mjs';
export { metricHasGap } from './metric.mjs';
const MAX_COVERAGE_DETAILS = 20;

/* metricHasGap is implemented in metric.mjs. */
/*
  if (typeof value !== 'string') return true;
  if (value.length > 2048) return true;
  const match = value.trim().match(/^(\d+)\s*\/\s*(\d+)$/);
  if (match) {
    const covered = BigInt(match[1]);
    const total = BigInt(match[2]);
    if (total <= 0n || covered > total) return true;
    return covered !== total;
  }
  const annotated = value.trim().match(/^(\d+(?:\.\d+)?)\s*%\s*\((\d+)\s*\/\s*(\d+)\)$/);
  if (annotated) {
    // Compare arbitrary-size raw counters without converting them through Number.
    const displayedHundredths = percentageHundredths(annotated[1]);
    const covered = BigInt(annotated[2]);
    const total = BigInt(annotated[3]);
    if (total <= 0n || covered > total) return true;
    const expectedHundredths = (covered * 10000n + total / 2n) / total;
    return covered !== total || displayedHundredths === null || displayedHundredths !== expectedHundredths;
  }
  const percentage = value.trim().match(/^(\d+(?:\.\d+)?)\s*%$/);
  if (percentage) {
    return !isExactHundred(percentage[1]);
  }
  const numeric = value.trim().match(/^\d+(?:\.\d+)?$/);
  if (numeric) {
    return !isExactHundred(numeric[0]);
  }
  return true;
}

function isExactHundred(value) {
  return /^100(?:\.0*)?$/.test(value);
}

function percentageHundredths(value) {
  const [whole, fraction = ''] = value.split('.');
  if (whole.length > 3) return null;
  if (BigInt(whole) > 100n || (whole === '100' && /[1-9]/.test(fraction))) return null;
  if (fraction.length > 1024) return null;
  let hundredths = BigInt(whole) * 100n + BigInt(fraction.slice(0, 2).padEnd(2, '0'));
  if (fraction.length > 2 && fraction[2] >= '5') hundredths += 1n;
  if (hundredths === 10000n && whole !== '100') return null;
  return hundredths;
}

*/
export function parseCoverageJson(json) {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return [];
  const gaps = [];
  for (const [file, data] of Object.entries(json)) {
    if (!data || typeof data !== 'object' || !data.statementMap) continue;
    const statements = Object.keys(data.statementMap).length === 0
      ? []
      : data.s !== undefined && data.s !== null && typeof data.s === 'object' && !Array.isArray(data.s)
      ? locationsForCounts(data.statementMap, data.s)
      : [{ type: 'statement' }];
    const branches = data.b !== undefined && (typeof data.b !== 'object' || Array.isArray(data.b))
      ? [{ type: 'branch' }]
      : Object.entries(data.b ?? {}).flatMap(([id, counts]) => uncoveredBranches(data.branchMap, id, counts));
    const functions = uncoveredFunctions(data);
    const lineCounts = new Map();
    let unmappedLineCount = 0;
    if (data.l && typeof data.l === 'object' && !Array.isArray(data.l)) {
      for (const [line, count] of Object.entries(data.l)) {
        const lineNumber = Number(line);
        if (Number.isInteger(lineNumber) && lineNumber > 0 && Number.isFinite(count)) lineCounts.set(lineNumber, isCoveredCount(count) ? 1 : 0);
      }
    }
    let hasUnmappedStatement = false;
    Object.entries(data.statementMap).forEach(([id, statement]) => {
      const statementCounts = data.s && (typeof data.s === 'object' || typeof data.s === 'function') ? data.s : {};
      const count = statementCounts[id];
      const statementStart = statement && typeof statement === 'object' && Object.hasOwn(statement, 'start')
        && statement.start && typeof statement.start === 'object' && !Array.isArray(statement.start)
        ? statement.start : undefined;
      const line = statementStart?.line;
      if (typeof line === 'number' && Number.isFinite(line) && !data.l) lineCounts.set(line, Math.min(lineCounts.get(line) ?? 1, isCoveredCount(count) ? 1 : 0));
      if (data.l) {
        if (!Number.isFinite(count)) hasUnmappedStatement = true;
      } else {
        unmappedLineCount += 1;
        if (!isCoveredCount(count)) hasUnmappedStatement = true;
      }
    });
    Object.entries(data.s ?? {}).forEach(([id, count]) => {
      if (!(id in data.statementMap) && !isCoveredCount(count)) hasUnmappedStatement = true;
    });
    const lines = new Set([...lineCounts].filter(([, count]) => count === 0).map(([line]) => line));
    // An l-map is authoritative for lines; statement gaps remain independently enforced.
    const lineGap = !data.l && hasUnmappedStatement;
    if (statements.length || branches.length || functions.length || lines.size || lineGap) {
      gaps.push({
        file,
        statements,
        branches,
        functions,
        lines: [...lines].sort((a, b) => a - b),
        metrics: {
          statements: percentage(data.s),
          branches: percentage(data.b),
          functions: percentage(data.f),
          lines: lineGap ? 0 : (lineCounts.size > 0 ? percentageWithUnknowns(lineCounts, unmappedLineCount) : 100)
        }
      });
    }
  }
  return gaps;
}

export function formatCoverageGaps(gaps, root = '') {
  const entries = Array.isArray(gaps) ? gaps : [];
  if (entries.length === 0) return '';
  return ['Coverage gaps:', 'File | Statements | Branches | Functions | Lines', ...entries.map((gap) => {
    const file = normalizeCoveragePath(gap?.file, root);
    if (Array.isArray(gap.metrics)) return `${file} | ${gap.metrics.join(' | ')}`;
    const location = (entry) => entry?.start?.line ? `${entry.start.line}${entry.start.column ? `:${entry.start.column}` : ''}` : 'unknown';
    const metrics = gap.metrics ?? { statements: '-', branches: '-', functions: '-', lines: '-' };
    const details = (items, formatter) => {
      items = Array.isArray(items) ? items : [];
      const visible = items.slice(0, MAX_COVERAGE_DETAILS).map(formatter).join(', ') || '-';
      const omitted = items.length - MAX_COVERAGE_DETAILS;
      return omitted > 0 ? `${visible} (+${omitted} more omitted)` : visible;
    };
    return [
      `${file} | ${metrics.statements}% | ${metrics.branches}% | ${metrics.functions}% | ${metrics.lines}% | uncovered lines: ${(Array.isArray(gap.lines) ? gap.lines : []).join(', ') || '-'}`,
      `  Uncovered statements: ${details(gap.statements, location)}`,
      `  Uncovered branches: ${details(gap.branches, (entry) => `${location(entry)} (${entry.type ?? 'branch'}, uncovered)`)}`,
      `  Uncovered functions: ${details(gap.functions, (fn) => `${fn?.name ?? 'anonymous'} at ${location(fn)}`)}`,
      '  Fix: add or extend tests that execute each listed statement, branch, and function path.'
    ].join('\n');
  }), '', 'Remediation: Add tests to improve coverage. Refactor the implementation if necessary to ensure proper testability. Remove any truly unreachable branches. Istanbul ignore directives are authorized only in pure barrel files.'].join('\n');
}
