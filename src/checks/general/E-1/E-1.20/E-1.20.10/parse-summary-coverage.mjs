const metrics = ["statements", "branches", "functions", "lines"];

export function parseSummary(json) {
  const total = json?.total;
  if (!total || metrics.some((metric) => {
    const entry = total[metric];
    const value = entry?.pct;
    const covered = entry?.covered;
    const totalCount = entry?.total;
    const hasCounts = covered !== undefined || totalCount !== undefined;
    return !Number.isFinite(value) || value < 0 || value > 100 ||
      (hasCounts && (!Number.isFinite(covered) || !Number.isFinite(totalCount) || covered < 0 || totalCount < 0 || covered > totalCount || (totalCount === 0 && value !== 0)));
  })) return null;
  return { gaps: [], totals: Object.fromEntries(metrics.map((metric) => [metric, total[metric].pct])) };
}
