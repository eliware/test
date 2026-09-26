import { coverageLineEntries, fileGap } from "./coverage-file-gap.mjs";
import { coverageMetricValues } from "./coverage-metrics.mjs";
import { isInScopeSource, normalizeSourcePath } from "./coverage-source-path.mjs";

const metrics = ["statements", "branches", "functions", "lines"];

export function parseDetailed(json, expectedFiles = [], expectedShapes = {}) {
  const counts = Object.fromEntries(metrics.map((metric) => [metric, { covered: 0, total: 0 }]));
  const gaps = [];
  const entries = Object.entries(json ?? {}).filter(([file]) => isInScopeSource(file));
  if (entries.length === 0 && expectedFiles.length === 0) return null;
  const reported = new Set(entries.map(([file]) => normalizeSourcePath(file)));
  const omitted = expectedFiles.filter((file) => isInScopeSource(file) && !reported.has(normalizeSourcePath(file)));
  if (omitted.length > 0) throw new Error(`Detailed coverage omits in-scope source file(s): ${omitted.join(", ")}.`);
  if (entries.length === 0) return null;
  for (const [file, data] of entries) {
    const gap = fileGap(file, data, expectedShapes[normalizeSourcePath(file)]);
    if (gap) gaps.push(gap);
    const { values } = coverageMetricValues(data, coverageLineEntries(data));
    const requiredMaps = ["s", "b", "f", "statementMap", "branchMap", "fnMap"];
    if (requiredMaps.some((key) => !Object.hasOwn(data, key))) {
      throw new Error(`Coverage evidence is incomplete for ${file}.`);
    }
    for (const [metric, metricValues] of Object.entries(values)) {
      counts[metric].total += metricValues.length;
      counts[metric].covered += metricValues.filter((count) => count > 0).length;
    }
  }
  return {
    gaps,
    totals: Object.fromEntries(
      metrics.map((metric) => [
        metric,
        counts[metric].total > 0
          ? (counts[metric].covered / counts[metric].total) * 100
          : null,
      ]),
    ),
  };
}
