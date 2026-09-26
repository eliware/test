import { fileGap } from "./coverage-file-gap.mjs";
import { coverageLineEntries } from "./coverage-line-entries.mjs";
import { coverageMetricValues } from "./coverage-metrics.mjs";
import { coverageMetricTotals } from "./coverage-metric-totals.mjs";
import { isInScopeSource, normalizeSourcePath } from "./coverage-source-path.mjs";

export function parseDetailed(json, expectedFiles = [], expectedShapes = {}) {
  const metricValuesByFile = [];
  const gaps = [];
  const entries = Object.entries(json ?? {}).filter(([file]) => isInScopeSource(file));
  if (entries.length === 0 && expectedFiles.length === 0) return null;
  const reported = new Set(entries.map(([file]) => normalizeSourcePath(file)));
  const omitted = expectedFiles.filter((file) => isInScopeSource(file) && !reported.has(normalizeSourcePath(file)));
  if (omitted.length > 0) throw new Error(`Detailed coverage omits in-scope source file(s): ${omitted.join(", ")}.`);
  const expected = new Set(expectedFiles.filter(isInScopeSource).map(normalizeSourcePath));
  if (expected.size > 0) {
    for (const file of reported) {
      if (!expected.has(file)) {
        throw new Error(`Detailed coverage contains non-repository source file: ${file}.`);
      }
      if (!expectedShapes[file]) {
        throw new Error(`Detailed coverage has no source-derived shape for ${file}.`);
      }
    }
  }
  if (entries.length === 0) return null;
  for (const [file, data] of entries) {
    const expectedShape = expectedShapes[normalizeSourcePath(file)];
    const requiredMaps = ["s", "b", "f", "statementMap", "branchMap", "fnMap"];
    if (requiredMaps.some((key) => !Object.hasOwn(data, key))) {
      throw new Error(`Coverage evidence is incomplete for ${file}.`);
    }
    const gap = fileGap(file, data, expectedShape);
    if (gap) gaps.push(gap);
    const { values } = coverageMetricValues(
      data,
      coverageLineEntries(data, expectedShape?.statementMap),
    );
    metricValuesByFile.push(values);
  }
  return {
    gaps,
    totals: coverageMetricTotals(metricValuesByFile),
  };
}
