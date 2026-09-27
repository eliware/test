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
  let capturedBytes = 0;
  const result = { stdout: "", stderr: "" };

  function append(stream, text) {
    const remaining = Math.max(0, outputLimit - capturedBytes);
    const encoded = Buffer.from(text);
    let bounded = text;
    if (encoded.length > remaining) {
      let end = remaining;
      bounded = "";
      while (end > 0) {
        const candidateBytes = encoded.subarray(0, end);
        const candidate = candidateBytes.toString("utf8");
        if (Buffer.byteLength(candidate) <= remaining && Buffer.from(candidate).equals(candidateBytes)) {
          bounded = candidate;
          break;
        }
        end -= 1;
      }
    }
    capturedBytes += Buffer.byteLength(bounded);
    result[stream] += bounded;
  }

  return {
    redactDiagnostic(text) {
      const redacted = redactors.stdout.redactComplete(String(text));
      let end = Math.min(redacted.length, outputLimit);
      if (end > 0 && end < redacted.length) {
        const last = redacted.charCodeAt(end - 1);
        const next = redacted.charCodeAt(end);
        if (last >= 0xd800 && last <= 0xdbff && next >= 0xdc00 && next <= 0xdfff) end -= 1;
      }
      return redacted.slice(0, end);
    },
    push(stream, chunk) {
      if (!redactors[stream] || capturedBytes >= outputLimit) return;
      const raw = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
      append(stream, redactors[stream].push(raw));
    },
    finish() {
      append("stdout", redactors.stdout.finish());
      append("stderr", redactors.stderr.finish());
      return result;
    },
  };
}
