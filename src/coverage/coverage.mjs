import { locationsForCounts } from './locations.mjs';
import { uncoveredBranches } from './branches.mjs';
import { uncoveredFunctions } from './functions.mjs';
import { collectLineCoverage } from './lines.mjs';
import { buildCoverageGap } from './build-gap.mjs';

/** Parse raw Istanbul JSON into coverage gaps. */
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
    const { lineCounts, unmappedLineCount, hasUnmappedStatement } = collectLineCoverage(data);
    const lineGap = !data.l && hasUnmappedStatement;
    const gap = buildCoverageGap(file, statements, branches, functions, data.s, data.b, data.f, lineCounts, unmappedLineCount, lineGap);
    if (gap) gaps.push(gap);
  }
  return gaps;
}
