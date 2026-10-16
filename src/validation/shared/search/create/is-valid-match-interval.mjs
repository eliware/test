export function isValidMatchInterval(interval) {
  return (
    interval !== null &&
    typeof interval === "object" &&
    Number.isSafeInteger(interval.start) &&
    Number.isSafeInteger(interval.end) &&
    interval.start >= 0 &&
    interval.end > interval.start
  );
}
