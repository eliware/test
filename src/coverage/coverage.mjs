import { locationsForCounts } from './locations.mjs';
import { uncoveredBranches } from './branches.mjs';
import { uncoveredFunctions } from './functions.mjs';
import { collectLineCoverage } from './lines.mjs';
import { buildCoverageGap } from './build-gap.mjs';
import { normalizeCoverageEntry, normalizeCoverageCount } from './normalize-coverage-entry.mjs';

/** Parse raw Istanbul JSON into coverage gaps. */
export function parseCoverageJson(json) {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return [];
  const gaps = [];
  for (const [file, data] of Object.entries(json)) {
    const normalized = normalizeCoverageEntry(file, data);
    const statements = locationsForCounts(normalized.statementMap, normalized.s);
    const branches = Object.entries(normalized.b).flatMap(([id, counts]) => uncoveredBranches(normalized.branchMap, id, counts));
    const branchCounts = normalized.b;
    const functions = uncoveredFunctions(normalized);
    const lineData = normalized.l ? { ...normalized, l: Object.fromEntries(Object.entries(normalized.l).map(([line, count]) => [line, normalizeCoverageCount(file, count)])) } : normalized;
    const { lineCounts, unmappedLineCount, hasUnmappedStatement, hasConflictingLineCoverage } = collectLineCoverage(lineData);
    const lineGap = hasUnmappedStatement || hasConflictingLineCoverage || [...lineCounts.values()].some((count) => count === 0);
    const gap = buildCoverageGap(file, statements, branches, functions, normalized.s, branchCounts, normalized.f, lineCounts, unmappedLineCount, lineGap);
    if (gap) gaps.push(gap);
  }
  return gaps;
}

export { normalizeCoverageCount } from './normalize-coverage-entry.mjs';
