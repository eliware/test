const sensitiveEnvironmentKey = /(?:password|passwd|pwd|token|secret|credential|api[_-]?key|access[_-]?key|private[_-]?key|client[_-]?(?:secret|id)|refresh[_-]?token|session[_-]?id)/iu;
import { redactCredentialFields } from "./redact-credential-fields.mjs";
import { redactHttpCredentials } from "./redact-http-credentials.mjs";
import { redactKnownTokenFormats } from "./redact-known-token-formats.mjs";

export function collectRedactionSecrets(environment) {
  if (!environment || typeof environment !== "object") return [];
  return [...new Set(Object.entries(environment)
    .filter(([key, value]) => sensitiveEnvironmentKey.test(key) && typeof value === "string" && value.length > 0)
    .map(([, value]) => value))]
    .sort((left, right) => right.length - left.length);
}

export function redactProcessOutput(text, secrets = []) {
  let output = String(text);
  for (const secret of secrets) {
    if (typeof secret === "string" && secret.length > 0) output = output.split(secret).join("[REDACTED]");
  }
  return redactKnownTokenFormats(redactHttpCredentials(redactCredentialFields(output)));
}
