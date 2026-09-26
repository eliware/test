import { collectRedactionSecrets } from "../../../collect-redaction-secrets.mjs";
import { createRedactedTextStream } from "../../../create-redacted-text-stream.mjs";

export function createChildOutputCapture(options, { onStdout, onStderr, captureStderr, env } = {}) {
  const outputLimit = options;
  const redactionSecrets = collectRedactionSecrets(env);
  const stdoutRedactor = createRedactedTextStream(redactionSecrets, outputLimit + 1);
  const stderrRedactor = createRedactedTextStream(redactionSecrets, outputLimit + 1);
  const stdoutChunks = [];
  const stderrChunks = [];
  let capturedLength = 0;
  let streamed = 0;

  const capture = (chunks, text) => {
    const remaining = Math.max(0, outputLimit - capturedLength);
    const bounded = text.length > remaining && remaining > 0
      ? `${text.slice(0, remaining - 1)}…`.slice(0, remaining)
      : text.slice(0, remaining);
    if (bounded) chunks.push(bounded);
    capturedLength += bounded.length;
  };

  const stream = (callback, text) => {
    if (!callback || streamed >= outputLimit || text.length === 0) return;
    const remaining = outputLimit - streamed;
    const bounded = text.slice(0, remaining);
    streamed += bounded.length;
    callback(bounded);
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
