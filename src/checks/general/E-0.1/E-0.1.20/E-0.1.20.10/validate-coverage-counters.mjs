export function validateCoverageCounters(values) {
  const valid = Object.values(values).every((counters) => counters.every(
    (counter) => Number.isSafeInteger(counter) && counter >= 0,
  ));
  return valid ? null : "Coverage counters must be non-negative safe integers.";
}
