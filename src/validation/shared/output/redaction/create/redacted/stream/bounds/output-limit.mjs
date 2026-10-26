const DEFAULT_OUTPUT_LIMIT = 100_000;
const MAX_OUTPUT_LIMIT = 1_000_000;

export function resolveOutputLimit(outputLimit) {
  return Number.isFinite(outputLimit)
    ? Math.max(0, Math.min(Math.floor(outputLimit), MAX_OUTPUT_LIMIT))
    : DEFAULT_OUTPUT_LIMIT;
}
