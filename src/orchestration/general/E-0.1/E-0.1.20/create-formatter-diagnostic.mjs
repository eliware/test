import { collectRedactionSecrets } from "../../../collect-redaction-secrets.mjs";
import { redactProcessOutput } from "../../../redact-process-output.mjs";
import { createOutputByteBudget } from "../../../create-output-byte-budget.mjs";

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
