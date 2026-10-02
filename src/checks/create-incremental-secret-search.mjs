import { createMatchIntervalIndex } from "./create-match-interval-index.mjs";

export function createIncrementalSearch(values, workLimit, createStream) {
  const findNewMatches = createStream();
  const matchIndex = createMatchIntervalIndex();
  const maximumSecretLength = values.reduce(
    (maximum, secret) => Math.max(maximum, secret.length),
    0,
  );
  let consumedWork = 0;
  let bufferStart = 0;
  let previousPending = "";
  let previousBoundary = 0;

  function findSafeBoundary(pending, includePendingMatches = false) {
    const retained = previousPending.slice(previousBoundary);
    if (!pending.startsWith(retained)) return { boundary: 0, matchEnds: [], suppressed: true };
    const appended = pending.slice(retained.length);
    const result = searchAppended(appended, pending.length, includePendingMatches);
    if (!result.suppressed) {
      previousPending = pending;
      previousBoundary = result.boundary;
    }
    return result;
  }

  findSafeBoundary.appendText = (text, pendingLength, includePendingMatches = false) =>
    searchAppended(text, pendingLength, includePendingMatches);
  return findSafeBoundary;

  function searchAppended(appended, pendingLength, includePendingMatches) {
    if (
      typeof appended !== "string" ||
      !Number.isSafeInteger(pendingLength) ||
      pendingLength < appended.length
    )
      return { boundary: 0, matchEnds: [], suppressed: true };
    const pendingStart = bufferStart;
    const pendingEnd = pendingStart + pendingLength;
    const found = findNewMatches(appended);
    if (!hasValidMatches(found, pendingStart, pendingEnd))
      return { boundary: 0, matchEnds: [], suppressed: true };
    consumedWork += found.work;
    if (consumedWork > workLimit) return { boundary: 0, matchEnds: [], suppressed: true };

    matchIndex.add(found.matches);

    const candidateBoundary = Math.max(0, pendingLength - maximumSecretLength);
    let boundary = candidateBoundary;
    const crossingStart = matchIndex.earliestCrossing(pendingStart + candidateBoundary);
    if (crossingStart !== null)
      boundary = Math.max(0, Math.min(boundary, crossingStart - pendingStart));
    const materializedLength = includePendingMatches ? pendingLength : boundary;
    const matchEnds = matchIndex.materialize(pendingStart, materializedLength);
    matchIndex.discardThrough(pendingStart + boundary);
    bufferStart = pendingStart + boundary;
    return { boundary, matchEnds, suppressed: false };
  }
}

function hasValidMatches(found, pendingStart, pendingEnd) {
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
