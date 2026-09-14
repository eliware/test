import { fileGap } from "./coverage-file-gap.mjs";

const metrics = ["statements", "branches", "functions", "lines"];

function isInScopeSource(file) {
  return /(?:^|\/)src\/.*\.(?:mjs|js|cjs)$/iu.test(file.split("\\").join("/"));
}

function hasInstrumentedCounters(data) {
  return metrics.some((metric) => {
    const values = metric === "statements" ? Object.values(data.s ?? {})
      : metric === "branches" ? Object.values(data.b ?? {}).flat()
        : metric === "functions" ? Object.values(data.f ?? {})
          : Object.values(data.l ?? data.s ?? {});
    return values.length > 0;
  });
}

export function parseDetailed(json) {
  const counts = Object.fromEntries(metrics.map((metric) => [metric, { covered: 0, total: 0 }]));
  const gaps = [];
  const entries = Object.entries(json ?? {}).filter(([file, data]) => isInScopeSource(file) && hasInstrumentedCounters(data));
  if (entries.length === 0) return null;
  for (const [file, data] of entries) {
    const gap = fileGap(file, data);
    if (gap) gaps.push(gap);
    for (const [metric, values] of Object.entries({
      statements: Object.values(data.s ?? {}), branches: Object.values(data.b ?? {}).flat(),
      functions: Object.values(data.f ?? {}), lines: Object.values(data.l ?? data.s ?? {}),
    })) {
      counts[metric].total += values.length;
      counts[metric].covered += values.filter((count) => count > 0).length;
    }
  }
  return {
    gaps,
    totals: Object.fromEntries(metrics.map((metric) => [
      metric,
      counts[metric].total > 0 ? (counts[metric].covered / counts[metric].total) * 100 : 100,
    ])),
  };
}
