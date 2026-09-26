const metricValues = (data, lineEntries) => ({
  statements: Object.values(data.s ?? {}),
  branches: Object.values(data.b ?? {}).flat(),
  functions: Object.values(data.f ?? {}),
  lines: lineEntries.map(([, count]) => count),
});

export function coverageMetricValues(data, lineEntries) {
  const values = metricValues(data, lineEntries);
  const hasCounters = Object.values(values).some((counts) => counts.length > 0);
  const hasMaps = Object.keys(data.statementMap ?? {}).length > 0 ||
    Object.keys(data.branchMap ?? {}).length > 0 ||
    Object.keys(data.fnMap ?? {}).length > 0 ||
    Object.keys(data.l ?? {}).length > 0;
  return { values, hasCounters, hasMaps };
}
