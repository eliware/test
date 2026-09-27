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
  const maximumSecretLength = Math.max(0, ...values.map((secret) => secret.length));
  let consumedWork = 0;
  let totalInputLength = 0;
  let previousPending = "";
  let previousBoundary = 0;
  let matches = [];

  return function findSafeBoundary(pending) {
    const retained = previousPending.slice(previousBoundary);
    if (!pending.startsWith(retained)) return { boundary: 0, matchEnds: [], suppressed: true };
    const appended = pending.slice(retained.length);
    const found = findNewMatches(appended);
    if (!found) return { boundary: 0, matchEnds: [], suppressed: true };
    consumedWork += found.work;
    if (consumedWork > workLimit) return { boundary: 0, matchEnds: [], suppressed: true };

    totalInputLength += appended.length;
    const pendingStart = totalInputLength - pending.length;
    const retainedMatches = matches.filter(({ end }) => end > pendingStart);
    matches = mergeMatches(retainedMatches, found.matches);
    const matchEnds = Array.from({ length: pending.length + 1 }, () => 0);
    for (const { start, end } of matches) {
      const localStart = start - pendingStart;
      const localEnd = end - pendingStart;
      if (localStart >= 0 && localEnd <= pending.length) {
        matchEnds[localStart] = Math.max(matchEnds[localStart], localEnd);
      }
    }

    const candidateBoundary = Math.max(0, pending.length - maximumSecretLength);
    let boundary = candidateBoundary;
    for (const { start, end } of matches) {
      const localStart = start - pendingStart;
      const localEnd = end - pendingStart;
      if (localStart < candidateBoundary && localEnd > candidateBoundary) {
        boundary = Math.max(0, Math.min(boundary, localStart));
      }
    }
    previousPending = pending;
    previousBoundary = boundary;
    return { boundary, matchEnds, suppressed: false };
  };
}

function mergeMatches(retained, discovered) {
  if (discovered.length === 0) return retained;
  const ordered = discovered.toSorted(compareMatchIntervals);
  const merged = [];
  let retainedIndex = 0;
  let discoveredIndex = 0;
  while (retainedIndex < retained.length && discoveredIndex < ordered.length) {
    if (compareMatchIntervals(retained[retainedIndex], ordered[discoveredIndex]) <= 0)
      merged.push(retained[retainedIndex++]);
    else merged.push(ordered[discoveredIndex++]);
  }
  return [...merged, ...retained.slice(retainedIndex), ...ordered.slice(discoveredIndex)];
}

function compareMatchIntervals(left, right) {
  return left.start - right.start || right.end - left.end;
}
