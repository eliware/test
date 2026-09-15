import { coverageLineEntries, fileGap } from "./coverage-file-gap.mjs";

const metrics = ["statements", "branches", "functions", "lines"];

function isInScopeSource(file) {
  const normalized = file.split("\\").join("/");
  return /^(?!.*(?:^|\/)(?:tests?|fixtures?|generated|dist|build)\/)(?:.*\/)?src\/.*\.(?:mjs|js|cjs)$/iu.test(normalized);
}

export function parseDetailed(json) {
  const counts = Object.fromEntries(metrics.map((metric) => [metric, { covered: 0, total: 0 }]));
  const gaps = [];
  let incomplete = false;
  const entries = Object.entries(json ?? {}).filter(([file]) => isInScopeSource(file));
  if (entries.length === 0) return null;
  for (const [file, data] of entries) {
    const gap = fileGap(file, data);
    if (gap) gaps.push(gap);
    const hasCounters = Object.keys(data.s ?? {}).length > 0 || Object.keys(data.b ?? {}).length > 0
      || Object.keys(data.f ?? {}).length > 0 || Object.keys(data.l ?? {}).length > 0;
    const hasMaps = Object.keys(data.statementMap ?? {}).length > 0 || Object.keys(data.branchMap ?? {}).length > 0
      || Object.keys(data.fnMap ?? {}).length > 0 || Object.keys(data.l ?? {}).length > 0;
    if (!hasCounters || !hasMaps) {
      incomplete = true;
      for (const metric of metrics) counts[metric].total += 1;
      continue;
    }
    for (const [metric, values] of Object.entries({
      statements: Object.values(data.s ?? {}), branches: Object.values(Object(data.b)).flat(),
      functions: Object.values(data.f ?? {}), lines: coverageLineEntries(data).map(([, count]) => count),
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
    incomplete,
  };
}
