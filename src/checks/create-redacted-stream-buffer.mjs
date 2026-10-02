import { redactMatchedSecrets } from "./redact-secrets.mjs";
import { createPendingTextChunks } from "./create-pending-text-chunks.mjs";

export function createRedactedStreamBuffer({
  pendingLimit,
  bufferLimit = pendingLimit,
  decoder,
  findSafeBoundary,
  trimSuffix,
  append,
  canContinue,
  suppress,
}) {
  let pending = "";
  const pendingChunks =
    typeof findSafeBoundary?.appendText === "function" ? createPendingTextChunks() : null;
  let finished = false;

  function clearPendingChunks() {
    if (pendingChunks) pendingChunks.clear();
  }

  function addText(text) {
    if (!canContinue() || finished) return "";
    let output = "";
    for (let start = 0; start < text.length && canContinue();) {
      const pendingLength = pendingChunks ? pendingChunks.length : pending.length;
      const capacity = bufferLimit - pendingLength;
      if (capacity <= 0) {
        suppress();
        pending = "";
        clearPendingChunks();
        return "";
      }
      const nextText = text.slice(start, start + Math.min(pendingLimit, capacity));
      if (pendingChunks) pendingChunks.append(nextText);
      else pending += nextText;
      start += nextText.length;
      const totalPendingLength = pendingChunks ? pendingChunks.length : pending.length;
      const result = pendingChunks
        ? findSafeBoundary.appendText(nextText, totalPendingLength)
        : findSafeBoundary(pending);
      const { boundary, matchEnds, suppressed } = result;
      if (suppressed) {
        suppress();
        pending = "";
        clearPendingChunks();
        return "";
      }
      if (boundary === 0) continue;
      const safePrefix = pendingChunks
        ? pendingChunks.takePrefix(boundary)
        : pending.slice(0, boundary);
      output += append(safePrefix, matchEnds);
      if (!pendingChunks) pending = pending.slice(boundary);
    }
    return output;
  }

  function finish() {
    if (finished) return "";
    finished = true;
    if (!canContinue()) return "";
    const finalText = decoder.end();
    if (pendingChunks) pendingChunks.append(finalText);
    else pending += finalText;
    const completePending = pendingChunks ? pendingChunks.toString() : pending;
    const result = pendingChunks
      ? findSafeBoundary.appendText(finalText, pendingChunks.length, true)
      : findSafeBoundary(pending, true);
    const { matchEnds, suppressed } = result;
    if (suppressed) {
      suppress();
      pending = "";
      clearPendingChunks();
      return "";
    }
    const safeText = trimSuffix(redactMatchedSecrets(completePending, matchEnds));
    pending = "";
    clearPendingChunks();
    return append(safeText, []);
  }

  return { addText, finish };
}
