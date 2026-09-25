import { coverageMetricValues } from "./coverage-metrics.mjs";
import { validateCoverageFileEvidence } from "./validate-coverage-file-evidence.mjs";

const metrics = ["statements", "branches", "functions", "lines"];

function percentage(covered, total) {
  return total > 0 ? (covered / total) * 100 : 100;
}

function location(entry) {
  return entry?.start?.line
    ? `${entry.start.line}${entry.start.column ? `:${entry.start.column}` : ""}`
    : "unknown";
}

export function coverageLineEntries(data) {
  const explicit = Object.entries(data.l ?? {});
  if (explicit.length > 0) return explicit;
  const lines = new Map();
  for (const [id, entry] of Object.entries(data.statementMap ?? {})) {
    const line = entry?.start?.line;
    if (line) {
      const count = Number(data.s?.[id] ?? 0);
      lines.set(String(line), lines.has(String(line)) ? Math.min(lines.get(String(line)), count) : count);
    }
  }
  return [...lines.entries()];
}

export function fileGap(file, data, expectedShape = null) {
  validateCoverageFileEvidence(file, data, expectedShape);
  const statements = Object.entries(data.s ?? {}).filter(([, count]) => count === 0)
    .map(([id]) => ({ location: location(data.statementMap?.[id]) }));
  const branches = Object.entries(data.b ?? {}).flatMap(([id, counts]) => counts.map((count, index) =>
    count === 0 ? { location: location(data.branchMap?.[id]?.locations?.[index] ?? data.branchMap?.[id]) } : null,
  ).filter(Boolean));
  const functions = Object.entries(data.f ?? {}).filter(([, count]) => count === 0)
    .map(([id]) => ({ name: data.fnMap?.[id]?.name ?? "anonymous", location: location(data.fnMap?.[id]) }));
  const lineEntries = coverageLineEntries(data);
  const lines = lineEntries.filter(([, count]) => count === 0).map(([line]) => line);
  const { values: metricCounters, hasCounters, hasMaps } = coverageMetricValues(data, lineEntries);
  const values = Object.fromEntries(metrics.map((metric) => [
    metric,
    percentage(metricCounters[metric].filter((count) => count > 0).length, metricCounters[metric].length),
  ]));
  if (!hasCounters || !hasMaps) return { file, metrics: { statements: 0, branches: 0, functions: 0, lines: 0 }, lines, statements, branches, functions };
  return metrics.every((metric) => values[metric] === 100)
    ? null
    : { file, metrics: values, lines, statements, branches, functions };
}
