import { redactCredentialFields } from "./credential-fields.mjs";
import { redactHttpCredentials } from "./http-credentials/index.mjs";
import { redactKnownTokenFormats } from "./known-token-formats.mjs";

export function redactProcessOutput(text, secrets = []) {
  let output = String(text);
  for (const secret of secrets) {
    if (typeof secret === "string" && secret.length > 0)
      output = output.split(secret).join("[REDACTED]");
  }
  if (output.length < 4) return output;
  return redactKnownTokenFormats(redactHttpCredentials(redactCredentialFields(output)));
}
