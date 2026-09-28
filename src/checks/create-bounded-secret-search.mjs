import { createMatchIntervalIndex } from "./create-match-interval-index.mjs";

export function createBoundedSecretSearch(values, workLimit, findSecretEnds) {
  let consumedWork = 0;
  const maximumSecretLength = values.reduce(
    (maximum, secret) => Math.max(maximum, secret.length),
    0,
  );
  const createStream = findSecretEnds.createStream;
  if (typeof createStream === "function")
    return createIncrementalSearch(values, workLimit, createStream);
  return function findSafeBoundary(pending) {
    let boundary = Math.max(0, pending.length - maximumSecretLength);
    const matchEnds = findSecretEnds(pending);
    if (!Array.isArray(matchEnds) || matchEnds.length < pending.length) {
      return { boundary: 0, matchEnds: [], suppressed: true };
    }
    for (let index = 0; index < pending.length; index += 1) {
      const end = matchEnds[index];
      if (
        !Object.hasOwn(matchEnds, index) ||
        !Number.isSafeInteger(end) ||
        end < 0 ||
        end > pending.length
      ) {
        return { boundary: 0, matchEnds: [], suppressed: true };
      }
    }
    const work = matchEnds.work ?? pending.length;
    if (!Number.isSafeInteger(work) || work < 0)
      return { boundary: 0, matchEnds: [], suppressed: true };
    consumedWork += work;
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
