import { appendFileSync, writeFileSync } from "node:fs";
import { redactCredentialFields } from "../../../../../../shared/output/redaction/redact/credential-fields.mjs";
import { redactHttpCredentials } from "../../../../../../shared/output/redaction/redact/http-credentials.mjs";
import { redactKnownTokenFormats } from "../../../../../../shared/output/redaction/redact/known-token-formats.mjs";
import { redactProcessOutput } from "../../../../../../shared/output/redaction/redact/process-output.mjs";

const logLimit = 1_000_000;

export function createJestConsoleOutputLog(
  path,
  { append = appendFileSync, replace = writeFileSync, maxLength = logLimit } = {},
) {
  const output = { stdout: [], stderr: [] };
  let length = 0;
  let truncated = false;
  let writeError;

  return {
    start() {
      try {
        if (path) replace(path, "", "utf8");
      } catch {
        writeError = true;
      }
    },
    append(stream, chunk) {
      if (!path || !Object.hasOwn(output, stream) || writeError || truncated) return;
      const text = String(chunk);
      const remaining = maxLength - length;
      const value = text.slice(0, remaining);
      if (value) {
        output[stream].push(value);
        length += value.length;
        try {
          append(path, `${JSON.stringify({ stream, text: value })}\n`, "utf8");
        } catch {
          writeError = true;
        }
      }
      if (value.length < text.length) truncated = true;
    },
    finish(secrets = []) {
      const streams = Object.fromEntries(
        Object.entries(output).map(([stream, chunks]) => {
          const source = chunks.join("");
          return [stream, redactProcessOutput(source, secrets)];
        }),
      );
      const redacted = Object.entries(output).some(
        ([stream, chunks]) => chunks.join("") !== streams[stream],
      );
      const redactionKinds = findRedactionKinds(output, secrets);
      const document = JSON.stringify({ ...streams, truncated });
      try {
        if (path) replace(path, document, "utf8");
      } catch {
        writeError = true;
      }
      return { redacted, redactionKinds, writeError: Boolean(writeError) };
    },
  };
}

function findRedactionKinds(output, secrets) {
  const texts = Object.values(output).map((chunks) => chunks.join(""));
  return [
    texts.some((text) => secrets.some((secret) => secret && text.includes(secret)))
      ? "environment secret"
      : null,
    texts.some((text) => redactCredentialFields(text) !== text) ? "credential field" : null,
    texts.some((text) => redactHttpCredentials(text) !== text) ? "HTTP credential" : null,
    texts.some((text) => redactKnownTokenFormats(text) !== text) ? "known token format" : null,
  ].filter(Boolean);
}
