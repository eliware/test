export function createBoundedFallbackSearch(values, workLimit, findSecretEnds) {
  let consumedWork = 0;
  const maximumSecretLength = values.reduce(
    (maximum, secret) => Math.max(maximum, secret.length),
    0,
  );
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
