export function adjustRedactedStreamBoundary(matchEnds, boundary, pendingChunks, pending) {
  const crossingStart = findCrossingStart(matchEnds, boundary);
  if (crossingStart >= 0) {
    boundary = crossingStart;
    matchEnds.length = boundary + 1;
  }
  const length = pendingChunks ? pendingChunks.length : pending.length;
  const codeUnits = pendingChunks
    ? pendingChunks.codeUnitsAtBoundary(boundary)
    : { previous: pending.charCodeAt(boundary - 1), next: pending.charCodeAt(boundary) };
  const { previous, next } = codeUnits;
  if (
    boundary > 0 &&
    boundary < length &&
    previous >= 0xd800 &&
    previous <= 0xdbff &&
    next >= 0xdc00 &&
    next <= 0xdfff
  )
    return boundary - 1;
  if (boundary === length && previous >= 0xd800 && previous <= 0xdbff) return boundary - 1;
  return boundary;
}

export function splitsSurrogatePair(text, followingCodeUnit) {
  const lastCodeUnit = text.charCodeAt(text.length - 1);
  return (
    lastCodeUnit >= 0xd800 &&
    lastCodeUnit <= 0xdbff &&
    followingCodeUnit >= 0xdc00 &&
    followingCodeUnit <= 0xdfff
  );
}

function findCrossingStart(matchEnds, boundary) {
  for (const key of Object.keys(matchEnds ?? [])) {
    const start = Number(key);
    if (start < boundary && matchEnds[start] > boundary) return start;
  }
  return -1;
}
