import { appendFileSync, writeFileSync } from "node:fs";
import { redactCredentialFields } from "../../../../../../shared/output/redaction/redact/credential-fields.mjs";
import { redactHttpCredentials } from "../../../../../../shared/output/redaction/redact/http-credentials/index.mjs";
import { redactKnownTokenFormats } from "../../../../../../shared/output/redaction/redact/known-token-formats.mjs";
import { redactGenericBase64Credentials } from "../../../../../../shared/output/redaction/redact/base64-credentials.mjs";
import { redactProcessOutput } from "../../../../../../shared/output/redaction/redact/process-output.mjs";

const logLimit = 1_000_000;
const truncationMarker = "\n[eliware-test: Jest output was truncated at the configured limit.]\n";

export function createJestConsoleOutputLog(
  path,
  { append = appendFileSync, replace = writeFileSync, maxLength = logLimit } = {},
) {
  const output = { stdout: [], stderr: [] };
  const chunks = [];
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
        chunks.push(value);
        length += value.length;
        try {
          append(path, value, "utf8");
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
      const captured = chunks.join("");
      const safeCaptured = redactProcessOutput(captured, secrets);
      const redacted =
        captured !== safeCaptured ||
        Object.entries(output).some(
          ([stream, streamChunks]) => streamChunks.join("") !== streams[stream],
        );
      const redactionKinds = findRedactionKinds({ stdout: [captured] }, secrets);
      try {
        if (path) replace(path, `${safeCaptured}${truncated ? truncationMarker : ""}`, "utf8");
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
    texts.some((text) => redactGenericBase64Credentials(text) !== text)
      ? "generic Base64 credential"
      : null,
  ].filter(Boolean);
}
