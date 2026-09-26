import { collectRedactionSecrets } from "../../../collect-redaction-secrets.mjs";
import { redactProcessOutput } from "../../../redact-process-output.mjs";

export function formatNpmAuditFailure(result, env = process.env) {
  const detail = redactProcessOutput(
    [result.stdout, result.stderr].filter(Boolean).join("\n").trim(),
    collectRedactionSecrets(env),
  );
  return detail ? `npm audit failed: ${detail}` : "npm audit failed without diagnostics.";
}

export function formatNpmAuditStartupFailure(error, env = process.env) {
  const detail = redactProcessOutput(error.message, collectRedactionSecrets(env));
  return `npm audit could not be started: ${detail}`;
}
