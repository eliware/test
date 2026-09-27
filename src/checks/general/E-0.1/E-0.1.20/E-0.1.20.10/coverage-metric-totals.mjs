const metrics = ["statements", "branches", "functions", "lines"];

export function coverageMetricTotals(valuesByFile) {
  const counts = Object.fromEntries(metrics.map((metric) => [metric, { covered: 0, total: 0 }]));
  for (const values of valuesByFile) {
    for (const metric of metrics) {
      const metricValues = values[metric] ?? [];
      counts[metric].total += metricValues.length;
      counts[metric].covered += metricValues.filter((count) => count > 0).length;
    }
  }
  return Object.fromEntries(
    metrics.map((metric) => [
      metric,
      counts[metric].total > 0 ? (counts[metric].covered / counts[metric].total) * 100 : null,
    ]),
  );
}
