import { adjustRedactedStreamBoundary, splitsSurrogatePair } from "./stream/boundary.mjs";

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
    if (splitsSurrogatePair(nextText, text.charCodeAt(nextTextEnd))) {
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
    const { boundary: safeBoundary, matchEnds, suppressed } = result;
    if (suppressed) return suppressStreamBuffer(pendingChunks, suppress);
    const boundary = adjustRedactedStreamBoundary(matchEnds, safeBoundary, pendingChunks, pending);
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
