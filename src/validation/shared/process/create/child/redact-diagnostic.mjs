import { truncateOutputTextToBytes } from "../../../output/redaction/create/output-byte-budget.mjs";
import { truncateRedactedOutput } from "../../../output/redaction/truncate-redacted-output.mjs";

export function redactChildProcessDiagnostic(text, redactor, outputLimit) {
  const redacted = redactor.redactComplete(String(text));
  const bounded = truncateOutputTextToBytes(redacted, outputLimit);
  return truncateRedactedOutput(redacted, bounded.text.length);
}
