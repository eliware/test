export function createBoundedSecretSearch(values, workLimit, findSecretEnds) {
  let consumedWork = 0;
  return function findSafeBoundary(pending) {
    let boundary = Math.max(0, pending.length - Math.max(0, ...values.map((secret) => secret.length)));
    const estimatedWork = values.length * pending.length;
    if (consumedWork + estimatedWork > workLimit) {
      return { boundary: 0, matchEnds: [], suppressed: true };
    }
    consumedWork += estimatedWork;
    const matchEnds = findSecretEnds(pending);
    if (matchEnds === null) return { boundary: 0, matchEnds: [], suppressed: true };
    for (let start = boundary - 1; start >= 0; start -= 1) {
      if (matchEnds[start] > boundary) boundary = start;
    }
    return { boundary, matchEnds, suppressed: false };
  };
}
