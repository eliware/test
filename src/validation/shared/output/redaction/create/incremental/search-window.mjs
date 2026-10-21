import { createMatchIntervalIndex } from "../../../../search/create/match-interval-index.mjs";

export function createIncrementalSearchWindow(values) {
  const matchIndex = createMatchIntervalIndex();
  const maximumSecretLength = values.reduce(
    (maximum, secret) => Math.max(maximum, secret.length),
    0,
  );
  let bufferStart = 0;
  let previousPending = "";
  let previousBoundary = 0;

  function appendedText(pending) {
    const retained = previousPending.slice(previousBoundary);
    if (!pending.startsWith(retained)) return { text: "", suppressed: true };
    return { text: pending.slice(retained.length), suppressed: false };
  }

  function applyMatches(matches, pendingLength, includePendingMatches) {
    matchIndex.add(matches);
    const candidateBoundary = Math.max(0, pendingLength - maximumSecretLength);
    let boundary = candidateBoundary;
    const crossingStart = matchIndex.earliestCrossing(bufferStart + candidateBoundary);
    if (crossingStart !== null)
      boundary = Math.max(0, Math.min(boundary, crossingStart - bufferStart));
    const materializedLength = includePendingMatches ? pendingLength : boundary;
    const matchEnds = matchIndex.materialize(bufferStart, materializedLength);
    matchIndex.discardThrough(bufferStart + boundary);
    bufferStart += boundary;
    return { boundary, matchEnds, suppressed: false };
  }

  return {
    appendedText,
    applyMatches,
    get bufferStart() {
      return bufferStart;
    },
    rememberPending(pending, boundary) {
      previousPending = pending;
      previousBoundary = boundary;
    },
  };
}
