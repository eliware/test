import { collectRedactionSecrets } from "../output/redaction/collect-redaction-secrets.mjs";
import { createRedactedTextStream } from "../output/redaction/create-redacted-text-stream.mjs";
import { truncateChildOutputText } from "./truncate-child-output-text.mjs";

export function createChildOutputCapture(
  options,
  { onStdout, onStderr, captureStderr, env, createTextStream = createRedactedTextStream } = {},
) {
  const outputLimit = options;
  const redactionSecrets = collectRedactionSecrets(env);
  const maxPendingLength = Math.max(1, Math.floor(outputLimit / 2));
  const stdoutRedactor = createTextStream(redactionSecrets, outputLimit + 1, {
    maxPendingLength,
  });
  const stderrRedactor = createTextStream(redactionSecrets, outputLimit + 1, {
    maxPendingLength,
  });
  const stdoutChunks = [];
  const stderrChunks = [];
  let capturedLength = 0;
  let lastCapturedChunks;
  let streamed = 0;

  const capture = (chunks, text) => {
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
  };

  const markTruncatedOutput = () => {
    const lastIndex = lastCapturedChunks?.length - 1;
    const lastChunk = lastCapturedChunks?.[lastIndex];
    if (lastChunk && !lastChunk.endsWith("…"))
      lastCapturedChunks[lastIndex] =
        `${truncateChildOutputText(lastChunk, lastChunk.length - 1)}…`;
  };

  const stream = (callback, text) => {
    if (!callback || streamed >= outputLimit || text.length === 0) return;
    const remaining = outputLimit - streamed;
    const bounded = truncateChildOutputText(text, remaining);
    streamed += bounded.length || outputLimit;
    if (bounded) callback(bounded);
  };

  const appendStdout = (text) => {
    stream(onStdout, text);
    capture(stdoutChunks, text);
  };
  const appendStderr = (text) => {
    stream(onStderr, text);
    capture(stderrChunks, captureStderr?.(text) ?? text);
  };

  return {
    stdout(text) {
      appendStdout(stdoutRedactor.push(text));
    },
    stderr(text) {
      const redacted = stderrRedactor.push(text);
      appendStderr(redacted);
      return redacted;
    },
    redactComplete(text) {
      return stderrRedactor.redactComplete(text);
    },
    flush() {
      appendStdout(stdoutRedactor.finish());
      const stderr = stderrRedactor.finish();
      appendStderr(stderr);
      return { stdout: "", stderr };
    },
    result() {
      return { stdout: stdoutChunks.join(""), stderr: stderrChunks.join("") };
    },
  };
}
