import { redactMatchedSecrets } from "./redact-secrets.mjs";

export function finishRedactedStreamBuffer({
  pending,
  pendingChunks,
  decoder,
  findSafeBoundary,
  trimSuffix,
  append,
  suppress,
}) {
  const finalText = decoder.end();
  if (pendingChunks) pendingChunks.append(finalText);
  else pending += finalText;
  const completePending = pendingChunks ? pendingChunks.toString() : pending;
  const result = pendingChunks
    ? findSafeBoundary.appendText(finalText, pendingChunks.length, true)
    : findSafeBoundary(pending, true);
  if (result.suppressed) {
    suppress();
    pendingChunks?.clear();
    return "";
  }
  const safeText = trimSuffix(redactMatchedSecrets(completePending, result.matchEnds));
  pendingChunks?.clear();
  return append(safeText, []);
}
