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
    const statements = locationsForCounts(data.statementMap, data.s);
    const branches = Object.entries(data.b).flatMap(([id, counts]) => uncoveredBranches(data.branchMap, id, counts));
    const branchCounts = data.b;
    const functions = uncoveredFunctions(data);
    const lineData = data.l ? { ...data, l: Object.fromEntries(Object.entries(data.l).map(([line, count]) => [line, Number(count)])) } : data;
    const { lineCounts, unmappedLineCount, hasUnmappedStatement, hasConflictingLineCoverage } = collectLineCoverage(lineData);
    const lineGap = hasUnmappedStatement || hasConflictingLineCoverage || [...lineCounts.values()].some((count) => count === 0);
    const gap = buildCoverageGap(file, statements, branches, functions, data.s, branchCounts, data.f, lineCounts, unmappedLineCount, lineGap);
    if (gap) gaps.push(gap);
  }
  return gaps;
}
