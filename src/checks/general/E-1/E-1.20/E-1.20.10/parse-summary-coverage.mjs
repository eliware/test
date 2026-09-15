const metrics = ["statements", "branches", "functions", "lines"];

export function parseSummary(json) {
  const total = json?.total;
  if (!total || metrics.some((metric) => {
    const value = total[metric]?.pct;
    return !Number.isFinite(value) || value < 0 || value > 100;
  })) return null;
  return { gaps: [], totals: Object.fromEntries(metrics.map((metric) => [metric, total[metric].pct])) };
}
