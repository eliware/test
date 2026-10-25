import { redactCredentialPatterns } from "./patterns.mjs";

export function redactProcessOutput(text, secrets = []) {
  let output = String(text);
  for (const secret of secrets) {
    if (typeof secret === "string" && secret.length > 0)
      output = output.split(secret).join("[REDACTED]");
  }
  return redactCredentialPatterns(output);
}
