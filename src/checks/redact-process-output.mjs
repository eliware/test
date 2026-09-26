import { redactCredentialFields } from "./redact-credential-fields.mjs";
import { redactHttpCredentials } from "./redact-http-credentials.mjs";
import { redactKnownTokenFormats } from "./redact-known-token-formats.mjs";

export function redactProcessOutput(text, secrets = []) {
  let output = String(text);
  for (const secret of secrets) {
    if (typeof secret === "string" && secret.length > 0) output = output.split(secret).join("[REDACTED]");
  }
  return redactKnownTokenFormats(redactHttpCredentials(redactCredentialFields(output)));
}
