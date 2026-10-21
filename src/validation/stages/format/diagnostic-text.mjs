import { collectRedactionSecrets } from "../../shared/output/redaction/collect-redaction-secrets.mjs";
import { redactProcessOutput } from "../../shared/output/redaction/redact/process-output.mjs";

export function createFormatterDiagnosticText(messages, env = process.env) {
  const secrets = collectRedactionSecrets(env);
  return messages
    .filter(Boolean)
    .map((text) => redactProcessOutput(text, secrets))
    .join("\n");
}
