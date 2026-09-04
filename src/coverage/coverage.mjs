import { locationsForCounts } from './locations.mjs';
import { uncoveredBranches } from './branches.mjs';
import { uncoveredFunctions } from './functions.mjs';
import { collectLineCoverage } from './lines.mjs';
import { buildCoverageGap } from './build-gap.mjs';
import { isUsableCoverageEntry } from './is-usable-coverage-entry.mjs';

function isDefaultArgumentBranch(branch) {
  return branch?.type === 'default-arg'
    && Array.isArray(branch.locations)
    && branch.locations.length > 0;
}

/** Parse raw Istanbul JSON into coverage gaps. */
export function parseCoverageJson(json) {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return [];
  const gaps = [];
  for (const [file, data] of Object.entries(json)) {
    if (!isUsableCoverageEntry(data)) throw new Error(`Malformed coverage entry: ${file}`);
    const statements = locationsForCounts(data.statementMap, data.s);
    const branches = Object.entries(data.b).flatMap(([id, counts]) => uncoveredBranches(data.branchMap, id, counts));
    const branchCounts = Object.fromEntries(Object.entries(data.b).filter(([id]) => !isDefaultArgumentBranch(data.branchMap?.[id])));
    const functions = uncoveredFunctions(data);
    const { lineCounts, unmappedLineCount, hasUnmappedStatement } = collectLineCoverage(data);
    const lineGap = hasUnmappedStatement || [...lineCounts.values()].some((count) => count === 0);
    const gap = buildCoverageGap(file, statements, branches, functions, data.s, branchCounts, data.f, lineCounts, unmappedLineCount, lineGap);
    if (gap) gaps.push(gap);
  }
  return gaps;
}
