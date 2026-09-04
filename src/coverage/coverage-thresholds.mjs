/** Required percentage for every Istanbul coverage metric. */
export const COVERAGE_THRESHOLDS = Object.freeze({
  statements: 100,
  branches: 100,
  functions: 100,
  lines: 100
});

export function meetsCoverageThresholds(metrics) {
  if (!metrics || typeof metrics !== 'object' || Array.isArray(metrics)) return false;
  return Object.entries(COVERAGE_THRESHOLDS).every(([metric, threshold]) => (
    Number.isFinite(metrics[metric]) && metrics[metric] >= threshold
  ));
}
