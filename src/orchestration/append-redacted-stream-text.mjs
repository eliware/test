export function appendRedactedStreamText({
  text,
  pending,
  pendingChunks,
  pendingLimit,
  bufferLimit,
  findSafeBoundary,
  append,
  canContinue,
  suppress,
}) {
  let output = "";
  for (let start = 0; start < text.length && canContinue();) {
    const pendingLength = pendingChunks ? pendingChunks.length : pending.length;
    const capacity = bufferLimit - pendingLength;
    if (capacity <= 0) return suppressStreamBuffer(pendingChunks, suppress);
    let nextLength = Math.min(pendingLimit, capacity);
    const nextTextEnd = start + nextLength;
    const nextText = text.slice(start, nextTextEnd);
    if (splitsSurrogate(nextText, text.charCodeAt(nextTextEnd))) {
      if (nextLength < capacity) nextLength += 1;
      else return suppressStreamBuffer(pendingChunks, suppress);
    }
    const safeNextText = text.slice(start, start + nextLength);
    if (pendingChunks) pendingChunks.append(safeNextText);
    else pending += safeNextText;
    start += safeNextText.length;
    const totalPendingLength = pendingChunks ? pendingChunks.length : pending.length;
    const result = pendingChunks
      ? findSafeBoundary.appendText(safeNextText, totalPendingLength)
      : findSafeBoundary(pending);
    let { boundary, matchEnds, suppressed } = result;
    if (suppressed) return suppressStreamBuffer(pendingChunks, suppress);
    boundary = moveBoundaryBeforeSurrogate(boundary, pendingChunks, pending);
    if (boundary === 0) continue;
    const safePrefix = pendingChunks
      ? pendingChunks.takePrefix(boundary)
      : pending.slice(0, boundary);
    output += append(safePrefix, matchEnds);
    if (!pendingChunks) pending = pending.slice(boundary);
  }
  return { output, pending };
}

function suppressStreamBuffer(pendingChunks, suppress) {
  suppress();
  pendingChunks?.clear();
  return { output: "", pending: "" };
}

function splitsSurrogate(text, followingCodeUnit) {
  const lastCodeUnit = text.charCodeAt(text.length - 1);
  return (
    lastCodeUnit >= 0xd800 &&
    lastCodeUnit <= 0xdbff &&
    followingCodeUnit >= 0xdc00 &&
    followingCodeUnit <= 0xdfff
  );
}

function moveBoundaryBeforeSurrogate(boundary, pendingChunks, pending) {
  const length = pendingChunks ? pendingChunks.length : pending.length;
  const { previous, next } = pendingChunks
    ? pendingChunks.codeUnitsAtBoundary(boundary)
    : { previous: pending.charCodeAt(boundary - 1), next: pending.charCodeAt(boundary) };
  if (
    boundary > 0 &&
    boundary < length &&
    previous >= 0xd800 &&
    previous <= 0xdbff &&
    next >= 0xdc00 &&
    next <= 0xdfff
  )
    return boundary - 1;
  return boundary;
}
