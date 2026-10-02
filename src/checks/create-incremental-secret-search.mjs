import { createMatchIntervalIndex } from "./create-match-interval-index.mjs";

export function createIncrementalSearch(values, workLimit, createStream) {
  const findNewMatches = createStream();
  const matchIndex = createMatchIntervalIndex();
  const maximumSecretLength = values.reduce(
    (maximum, secret) => Math.max(maximum, secret.length),
    0,
  );
  let consumedWork = 0;
  let previousPendingStart = 0;
  let previousPending = "";
  let previousBoundary = 0;

  return function findSafeBoundary(pending, includePendingMatches = false) {
    const retained = previousPending.slice(previousBoundary);
    if (!pending.startsWith(retained)) return { boundary: 0, matchEnds: [], suppressed: true };
    const appended = pending.slice(retained.length);
    const found = findNewMatches(appended);
    if (!found) return { boundary: 0, matchEnds: [], suppressed: true };
    consumedWork += found.work;
    if (consumedWork > workLimit) return { boundary: 0, matchEnds: [], suppressed: true };

    const pendingStart = previousPendingStart + previousBoundary;
    matchIndex.add(found.matches);

    const candidateBoundary = Math.max(0, pending.length - maximumSecretLength);
    let boundary = candidateBoundary;
    const crossingStart = matchIndex.earliestCrossing(pendingStart + candidateBoundary);
    if (crossingStart !== null)
      boundary = Math.max(0, Math.min(boundary, crossingStart - pendingStart));
    previousPending = pending;
    previousBoundary = boundary;
    previousPendingStart = pendingStart;
    const materializedLength = includePendingMatches ? pending.length : boundary;
    const matchEnds = matchIndex.materialize(pendingStart, materializedLength);
    matchIndex.discardThrough(pendingStart + boundary);
    return { boundary, matchEnds, suppressed: false };
  };
}
