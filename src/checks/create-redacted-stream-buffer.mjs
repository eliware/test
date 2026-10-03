import { createPendingTextChunks } from "./create-pending-text-chunks.mjs";
import { finishRedactedStreamBuffer } from "./finish-redacted-stream-buffer.mjs";
import { appendRedactedStreamText } from "./append-redacted-stream-text.mjs";

export function createRedactedStreamBuffer({
  pendingLimit,
  bufferLimit = pendingLimit,
  decoder,
  findSafeBoundary,
  trimSuffix,
  append,
  canContinue,
  suppress,
  createPendingTextChunks: createPendingTextChunksFactory = createPendingTextChunks,
}) {
  let pending = "";
  const pendingChunks =
    typeof findSafeBoundary?.appendText === "function" ? createPendingTextChunksFactory() : null;
  let finished = false;

  function addText(text) {
    if (finished) return "";
    const result = appendRedactedStreamText({
      text,
      pending,
      pendingChunks,
      pendingLimit,
      bufferLimit,
      findSafeBoundary,
      append,
      canContinue,
      suppress,
    });
    pending = result.pending;
    return result.output;
  }

  function finish() {
    if (finished) return "";
    finished = true;
    if (!canContinue()) return "";
    const output = finishRedactedStreamBuffer({
      pending,
      pendingChunks,
      decoder,
      findSafeBoundary,
      trimSuffix,
      append,
      suppress,
    });
    pending = "";
    return output;
  }

  return { addText, finish };
}
