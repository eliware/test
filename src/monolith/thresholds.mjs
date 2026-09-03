export const DEFAULT_THRESHOLDS = Object.freeze({ source: 300, test: 600 });

/** Resolve and validate the configured threshold for a file category. */
export function thresholdFor(kind, thresholds = DEFAULT_THRESHOLDS) {
  if (typeof kind !== 'string' || !Object.hasOwn(thresholds, kind)) {
    throw new TypeError(`Unknown monolith file kind: ${kind}`);
  }
  const threshold = thresholds[kind];
  if (!Number.isInteger(threshold) || threshold <= 0) {
    throw new TypeError(`Invalid monolith threshold for ${kind}`);
  }
  return threshold;
}

/** Return whether a non-negative line count exceeds its category threshold. */
export function exceedsThreshold(lineCount, kind, thresholds = DEFAULT_THRESHOLDS) {
  if (!Number.isInteger(lineCount) || lineCount < 0) {
    throw new TypeError('lineCount must be a non-negative integer');
  }
  return lineCount > thresholdFor(kind, thresholds);
}
