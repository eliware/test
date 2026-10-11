export function hasValidSecretMatchResults(found, pendingStart, pendingEnd) {
  return (
    found !== null &&
    typeof found === "object" &&
    Number.isSafeInteger(found.work) &&
    found.work >= 0 &&
    Array.isArray(found.matches) &&
    Array.from(found.matches).every(
      (interval) =>
        interval !== null &&
        typeof interval === "object" &&
        Number.isSafeInteger(interval.start) &&
        Number.isSafeInteger(interval.end) &&
        interval.start >= pendingStart &&
        interval.end > interval.start &&
        interval.end <= pendingEnd,
    )
  );
}
