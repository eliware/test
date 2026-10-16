export function resolveChildOutputLimit(requestedOutputLimit) {
  return Number.isFinite(requestedOutputLimit) && requestedOutputLimit > 0
    ? Math.min(Math.floor(requestedOutputLimit), 1_000_000)
    : 100_000;
}
