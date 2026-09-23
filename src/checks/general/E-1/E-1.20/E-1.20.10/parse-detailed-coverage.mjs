import { coverageLineEntries, fileGap } from "./coverage-file-gap.mjs";
import { coverageMetricValues } from "./coverage-metrics.mjs";

const metrics = ["statements", "branches", "functions", "lines"];

function isInScopeSource(file) {
  const normalized = file.split("\\").join("/");
  const sourceIndex = normalized.lastIndexOf("/src/");
  if (sourceIndex < 0 && !normalized.startsWith("src/")) return false;
  if (!/\.(?:mjs|js|cjs)$/iu.test(normalized)) return false;
  const sourcePath = sourceIndex < 0 ? normalized.slice(4) : normalized.slice(sourceIndex + 5);
  return !/(?:^|\/)(?:tests?|fixtures?|generated|dist|build)(?:\/|$)/iu.test(sourcePath);
}

export function parseDetailed(json) {
  const counts = Object.fromEntries(metrics.map((metric) => [metric, { covered: 0, total: 0 }]));
  const gaps = [];
  const entries = Object.entries(json ?? {}).filter(([file]) => isInScopeSource(file));
  if (entries.length === 0) return null;
  for (const [file, data] of entries) {
    const gap = fileGap(file, data);
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
        counts[metric].total > 0 ? (counts[metric].covered / counts[metric].total) * 100 : 0,
      ]),
    ),
  };
}
