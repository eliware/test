import { createMatchIntervalIndex } from "./create-match-interval-index.mjs";

export function createBoundedSecretSearch(values, workLimit, findSecretEnds) {
  let consumedWork = 0;
  const createStream = findSecretEnds.createStream;
  if (typeof createStream === "function")
    return createIncrementalSearch(values, workLimit, createStream);
  return function findSafeBoundary(pending) {
    let boundary = Math.max(
      0,
      pending.length - Math.max(0, ...values.map((secret) => secret.length)),
    );
    const matchEnds = findSecretEnds(pending);
    if (matchEnds === null) return { boundary: 0, matchEnds: [], suppressed: true };
    consumedWork += matchEnds.work ?? pending.length;
    if (consumedWork > workLimit) return { boundary: 0, matchEnds: [], suppressed: true };
    for (let start = boundary - 1; start >= 0; start -= 1) {
      if (matchEnds[start] > boundary) boundary = start;
    }
    return { boundary, matchEnds, suppressed: false };
  };
}

function createIncrementalSearch(values, workLimit, createStream) {
  const findNewMatches = createStream();
  const matchIndex = createMatchIntervalIndex();
  const maximumSecretLength = Math.max(0, ...values.map((secret) => secret.length));
  let consumedWork = 0;
  let totalInputLength = 0;
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

    totalInputLength += appended.length;
    const pendingStart = totalInputLength - pending.length;
    matchIndex.add(found.matches);

    const candidateBoundary = Math.max(0, pending.length - maximumSecretLength);
    let boundary = candidateBoundary;
    const crossingStart = matchIndex.earliestCrossing(pendingStart + candidateBoundary);
    if (crossingStart !== null)
      boundary = Math.max(0, Math.min(boundary, crossingStart - pendingStart));
    previousPending = pending;
    previousBoundary = boundary;
    const materializedLength = includePendingMatches ? pending.length : boundary;
    const matchEnds = matchIndex.materialize(pendingStart, materializedLength);
    matchIndex.discardThrough(pendingStart + boundary);
    return { boundary, matchEnds, suppressed: false };
  };
}
