import { collectRedactionSecrets, redactProcessOutput } from "../../../redact-process-output.mjs";

export function createChildOutputCapture(options, { onStdout, onStderr, captureStderr, env } = {}) {
  const outputLimit = options;
  const redactionSecrets = collectRedactionSecrets(env);
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
    if (!callback || streamed >= outputLimit) return;
    const remaining = outputLimit - streamed;
    const bounded = redactProcessOutput(text, redactionSecrets).slice(0, remaining);
    streamed += bounded.length;
    callback(bounded);
  };

  return {
    redact(text) {
      return redactProcessOutput(text, redactionSecrets);
    },
    stdout(text) {
      const redacted = this.redact(text);
      stream(onStdout, redacted);
      capture(stdoutChunks, redacted);
    },
    stderr(text) {
      const redacted = this.redact(text);
      stream(onStderr, redacted);
      capture(stderrChunks, captureStderr?.(redacted) ?? redacted);
    },
    result() {
      return { stdout: stdoutChunks.join(""), stderr: stderrChunks.join("") };
    },
  };
}
