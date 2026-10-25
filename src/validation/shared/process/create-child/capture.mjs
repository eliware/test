import { truncateChildOutputText } from "../truncate-child-output-text.mjs";

export function createChildOutputCaptureBuffer(outputLimit) {
  const stdoutChunks = [];
  const stderrChunks = [];
  let capturedLength = 0;
  let lastCapturedChunks;

  function markTruncatedOutput() {
    const lastIndex = lastCapturedChunks?.length - 1;
    const lastChunk = lastCapturedChunks?.[lastIndex];
    if (lastChunk && !lastChunk.endsWith("…"))
      lastCapturedChunks[lastIndex] =
        `${truncateChildOutputText(lastChunk, lastChunk.length - 1)}…`;
  }

  function append(chunks, text) {
    if (!text) return;
    const remaining = Math.max(0, outputLimit - capturedLength);
    if (remaining === 0) {
      markTruncatedOutput();
      return;
    }
    const bounded =
      text.length > remaining
        ? `${truncateChildOutputText(text, remaining - 1)}…`
        : truncateChildOutputText(text, remaining);
    chunks.push(bounded);
    lastCapturedChunks = chunks;
    capturedLength += bounded.length;
  }

  return {
    appendStdout(text) {
      append(stdoutChunks, text);
    },
    appendStderr(text) {
      append(stderrChunks, text);
    },
    result() {
      return { stdout: stdoutChunks.join(""), stderr: stderrChunks.join("") };
    },
  };
}
