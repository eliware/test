import { validateCoverageCounters } from "./validate-coverage-counters.mjs";

const metricValues = (data, lineEntries) => ({
  statements: Object.values(data.s ?? {}),
  branches: Object.values(data.b ?? {}).flat(),
  functions: Object.values(data.f ?? {}),
  lines: lineEntries.map(([, count]) => count),
});

export function coverageMetricValues(data, lineEntries) {
  const values = metricValues(data, lineEntries);
  const counterError = validateCoverageCounters(values);
  if (counterError) throw new Error(counterError);
  const hasCounters = Object.values(values).some((counts) => counts.length > 0);
  const hasMaps = [
    [data.statementMap, data.s],
    [data.branchMap, data.b],
    [data.fnMap, data.f],
  ].every(([map, counters]) => {
    if (!map || !counters || typeof map !== "object" || typeof counters !== "object") return false;
    const mapKeys = Object.keys(map).sort();
    const counterKeys = Object.keys(counters).sort();
    return (
      mapKeys.length === counterKeys.length &&
      mapKeys.every((key, index) => key === counterKeys[index])
    );
  });
  return { values, hasCounters, hasMaps: hasMaps && hasCounters };
}
