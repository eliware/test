import { redactMatchedSecrets } from "./redact-secrets.mjs";

export function createRedactedStreamBuffer({
  pendingLimit,
  decoder,
  findSafeBoundary,
  trimSuffix,
  append,
  canContinue,
  suppress,
}) {
  let pending = "";
  let finished = false;

  function addText(text) {
    if (!canContinue() || finished) return "";
    let output = "";
    for (let start = 0; start < text.length && canContinue();) {
      const nextText = text.slice(start, start + Math.max(1, pendingLimit - pending.length));
      pending += nextText;
      start += nextText.length;
      const { boundary, matchEnds, suppressed } = findSafeBoundary(pending);
      if (suppressed) {
        suppress();
        pending = "";
        return "";
      }
      if (boundary === 0) continue;
      output += append(pending.slice(0, boundary), matchEnds);
      pending = pending.slice(boundary);
    }
    return output;
  }

  function finish() {
    if (finished) return "";
    finished = true;
    if (!canContinue()) return "";
    pending += decoder.end();
    const { matchEnds, suppressed } = findSafeBoundary(pending, true);
    if (suppressed) {
      suppress();
      pending = "";
      return "";
    }
    const safeText = trimSuffix(redactMatchedSecrets(pending, matchEnds));
    pending = "";
    return append(safeText, []);
  }

  return { addText, finish };
}
