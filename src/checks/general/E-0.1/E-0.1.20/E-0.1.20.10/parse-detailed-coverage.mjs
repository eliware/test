import { fileGap } from "./coverage-file-gap.mjs";
import { coverageLineEntries } from "./coverage-line-entries.mjs";
import { coverageMetricValues } from "./coverage-metrics.mjs";
import { coverageMetricTotals } from "./coverage-metric-totals.mjs";
import { normalizeSourcePath } from "./coverage-source-path.mjs";
import { validateDetailedCoverageFiles } from "./validate-detailed-coverage-files.mjs";

export function parseDetailed(json, expectedFiles = [], expectedShapes = {}) {
  const metricValuesByFile = [];
  const gaps = [];
  const entries = validateDetailedCoverageFiles(json, expectedFiles, expectedShapes);
  if (entries.length === 0) return null;
  for (const [file, data] of entries) {
    const expectedShape = expectedShapes[normalizeSourcePath(file)];
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
