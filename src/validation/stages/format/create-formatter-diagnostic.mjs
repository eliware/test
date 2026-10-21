import { truncateOutputTextToBytes } from "../../shared/output/redaction/create/output-byte-budget.mjs";
import { createFormatterDiagnosticText } from "./diagnostic-text.mjs";

export function createFormatterDiagnostic(label, messages, env = process.env) {
  const detail = createFormatterDiagnosticText(messages, env);
  const boundedDetail = truncateOutputTextToBytes(detail, 100_000).text.trim();
  return boundedDetail ? `${label}: ${boundedDetail}` : `${label} without diagnostics.`;
}
