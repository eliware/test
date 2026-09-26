const metrics = ["statements", "branches", "functions", "lines"];

export function assessCoverageEvidence(evidence, { focusedPath = false } = {}) {
  if (
    !evidence ||
    !Array.isArray(evidence.gaps) ||
    !evidence.totals ||
    metrics.some((metric) => {
      const value = evidence.totals[metric];
      return value !== null && (typeof value !== "number" || !Number.isFinite(value));
    }) ||
    (!focusedPath && metrics.some((metric) => evidence.totals[metric] === null))
  ) {
    throw new Error("Coverage evidence has an invalid shape.");
  }

  return {
    aggregateGaps: metrics.filter(
      (metric) => evidence.totals[metric] !== 100 && evidence.totals[metric] !== null,
    ),
    hasFileGaps: evidence.gaps.length > 0,
  };
}
