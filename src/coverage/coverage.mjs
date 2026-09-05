import { locationsForCounts } from './locations.mjs';
import { uncoveredBranches } from './branches.mjs';
import { uncoveredFunctions } from './functions.mjs';
import { collectLineCoverage } from './lines.mjs';
import { buildCoverageGap } from './build-gap.mjs';
import { isUsableCoverageEntry } from './is-usable-coverage-entry.mjs';

/** Parse raw Istanbul JSON into coverage gaps. */
export function parseCoverageJson(json) {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return [];
  const gaps = [];
  for (const [file, data] of Object.entries(json)) {
    if (!isUsableCoverageEntry(data)) throw new Error(`Malformed coverage entry: ${file}`);
    const normalized = { ...data, s: Object.fromEntries(Object.entries(data.s).map(([id, count]) => [id, Number(count)])), b: Object.fromEntries(Object.entries(data.b).map(([id, counts]) => [id, counts.map(Number)])), f: Object.fromEntries(Object.entries(data.f).map(([id, count]) => [id, Number(count)])) };
    const statements = locationsForCounts(normalized.statementMap, normalized.s);
    const branches = Object.entries(normalized.b).flatMap(([id, counts]) => uncoveredBranches(normalized.branchMap, id, counts));
    const branchCounts = normalized.b;
    const functions = uncoveredFunctions(normalized);
    const lineData = normalized.l ? { ...normalized, l: Object.fromEntries(Object.entries(normalized.l).map(([line, count]) => [line, Number(count)])) } : normalized;
    const { lineCounts, unmappedLineCount, hasUnmappedStatement, hasConflictingLineCoverage } = collectLineCoverage(lineData);
    const lineGap = hasUnmappedStatement || hasConflictingLineCoverage || [...lineCounts.values()].some((count) => count === 0);
    const gap = buildCoverageGap(file, statements, branches, functions, normalized.s, branchCounts, normalized.f, lineCounts, unmappedLineCount, lineGap);
    if (gap) gaps.push(gap);
  }
  return gaps;
}
