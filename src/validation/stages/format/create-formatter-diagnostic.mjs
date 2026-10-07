import { collectRedactionSecrets } from "../../shared/output/redaction/collect-redaction-secrets.mjs";
import { redactProcessOutput } from "../../shared/output/redaction/redact-process-output.mjs";
import { createOutputByteBudget } from "../../shared/output/redaction/create-output-byte-budget.mjs";

export function createFormatterDiagnostic(label, messages, env = process.env) {
  const secrets = collectRedactionSecrets(env);
  const outputBudget = createOutputByteBudget(100_000);
  const detail = messages
    .filter(Boolean)
    .map((text) => redactProcessOutput(text, secrets))
    .join("\n");
  const boundedDetail = outputBudget.truncate(detail).trim();
  return boundedDetail ? `${label}: ${boundedDetail}` : `${label} without diagnostics.`;
}
