import { collectRedactionSecrets } from "./collect-redaction-secrets.mjs";
import { createRedactedTextStream } from "./create-redacted-text-stream.mjs";

export function createChildProcessOutputCapture(options, suppliedSecrets, outputLimit) {
  const redactionSecrets = [
    ...collectRedactionSecrets(options.env ?? process.env),
    ...(Array.isArray(suppliedSecrets) ? suppliedSecrets : []),
  ];
  const redactors = {
    stdout: createRedactedTextStream(redactionSecrets, outputLimit),
    stderr: createRedactedTextStream(redactionSecrets, outputLimit),
  };
  let captured = 0;
  let rawCaptured = 0;
  const result = { stdout: "", stderr: "" };

  function append(stream, text) {
    const bounded = text.slice(0, Math.max(0, outputLimit - captured));
    captured += bounded.length;
    result[stream] += bounded;
  }

  return {
    push(stream, chunk) {
      if (!redactors[stream] || captured >= outputLimit || rawCaptured >= outputLimit) return;
      const raw = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
      const bounded = raw.subarray(0, outputLimit - rawCaptured);
      rawCaptured += bounded.length;
      append(stream, redactors[stream].push(bounded));
    },
    finish() {
      append("stdout", redactors.stdout.finish());
      append("stderr", redactors.stderr.finish());
      return result;
    },
  };
}
