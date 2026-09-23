import { coverageMetricValues } from "./coverage-metrics.mjs";

const metrics = ["statements", "branches", "functions", "lines"];

function validCounter(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

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

export function fileGap(file, data) {
  const hasCounterData = Object.keys(data.s ?? {}).length > 0 || Object.keys(data.b ?? {}).length > 0
    || Object.keys(data.f ?? {}).length > 0 || Object.keys(data.l ?? {}).length > 0;
  const hasMapData = Object.keys(data.statementMap ?? {}).length > 0 || Object.keys(data.branchMap ?? {}).length > 0
    || Object.keys(data.fnMap ?? {}).length > 0 || Object.keys(data.lineMap ?? {}).length > 0;
  if (hasCounterData !== hasMapData) throw new Error(`Coverage evidence is incomplete for ${file}.`);
  for (const [map, counters, required] of [
    [data.statementMap, data.s, Object.hasOwn(data, "statementMap") || Object.hasOwn(data, "s")],
    [data.branchMap, data.b, Object.hasOwn(data, "branchMap") || Object.hasOwn(data, "b")],
    [data.fnMap, data.f, Object.hasOwn(data, "fnMap") || Object.hasOwn(data, "f")],
    [data.lineMap, data.l, Object.hasOwn(data, "lineMap")],
  ]) {
    const mapKeys = Object.keys(map ?? {});
    const counterKeys = Object.keys(counters ?? {});
    if (!required && !map) continue;
    if (!map || !counters || (mapKeys.length > 0 && counterKeys.length === 0)) {
      throw new Error(`Coverage evidence is incomplete for ${file}.`);
    }
    if (mapKeys.length !== counterKeys.length || mapKeys.some((key) => !Object.hasOwn(counters, key))) {
      throw new Error(`Coverage map and counter keys do not match for ${file}.`);
    }
  }
  const counterValues = [
    ...Object.values(data.s ?? {}),
    ...Object.values(data.b ?? {}).flat(),
    ...Object.values(data.f ?? {}),
    ...Object.values(data.l ?? {}),
  ];
  if (counterValues.some((value) => !validCounter(value))) {
    throw new Error(`Coverage evidence is malformed for ${file}.`);
  }
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
