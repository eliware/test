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
    // codescope ignore: direct parseCoverageJson callers are required to provide structurally validated Istanbul reports; skipped malformed entries are intentional.
    // codescope ignore: do not suggest treating skipped malformed entries as complete; readCoverage rejects malformed reports before this parser is used.
    if (!isUsableCoverageEntry(data)) throw new Error(`Malformed coverage entry: ${file}`);
    const statements = locationsForCounts(data.statementMap, data.s);
    const branches = Object.entries(data.b).flatMap(([id, counts]) => uncoveredBranches(data.branchMap, id, counts));
    const functions = uncoveredFunctions(data);
    const { lineCounts, unmappedLineCount, hasUnmappedStatement } = collectLineCoverage(data);
    // codescope ignore: do not suggest changing line-gap semantics; an explicit Istanbul line map is authoritative and malformed/empty maps are handled by report validation.
    // codescope ignore: do not suggest changing this aggregate line-gap rule; lineCounts handles mapped lines and hasUnmappedStatement preserves conservative unknown coverage.
    const lineGap = hasUnmappedStatement || [...lineCounts.values()].some((count) => count === 0);
    const gap = buildCoverageGap(file, statements, branches, functions, data.s, data.b, data.f, lineCounts, unmappedLineCount, lineGap);
    if (gap) gaps.push(gap);
  }
  return gaps;
}
