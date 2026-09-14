import { fileGap } from "./coverage-file-gap.mjs";

const metrics = ["statements", "branches", "functions", "lines"];

export function parseDetailed(json) {
  const counts = Object.fromEntries(metrics.map((metric) => [metric, { covered: 0, total: 0 }]));
  const gaps = [];
  for (const [file, data] of Object.entries(json ?? {})) {
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
