import { collectRedactionSecrets } from "../../collect-redaction-secrets.mjs";
import { redactProcessOutput } from "../../redact-process-output.mjs";

export function formatOutdatedDependencyError(error, environment = process.env) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return redactProcessOutput(message, collectRedactionSecrets(environment)).slice(0, 1_000) ||
    "unknown registry lookup error";
}
