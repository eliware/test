import { redactProcessOutput } from "./redact-process-output.mjs";
import { redactMatchedSecrets } from "./redact-secrets.mjs";

export function redactCompleteOutput(
  text,
  { suppressed, values, workLimit, findSecretEnds, trimSuffix },
) {
  const value = String(text);
  if (suppressed || values.length * value.length > workLimit) return "";
  const matchEnds = findSecretEnds(value);
  if (matchEnds === null) return "";
  const redacted = redactMatchedSecrets(value, matchEnds);
  return trimSuffix(redactProcessOutput(redacted, []));
}
