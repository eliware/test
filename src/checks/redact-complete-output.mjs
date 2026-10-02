import { redactProcessOutput } from "./redact-process-output.mjs";
import { redactMatchedSecrets } from "./redact-secrets.mjs";

export function redactCompleteOutput(
  text,
  { suppressed, values, workLimit, findSecretEnds, trimSuffix },
) {
  const value = String(text);
  if (suppressed || values.length * value.length > workLimit) return "";
  const matchEnds = findSecretEnds(value);
  if (!hasCompleteSecretMatches(value, values, matchEnds)) return "";
  const redacted = redactMatchedSecrets(value, matchEnds);
  return trimSuffix(redactProcessOutput(redacted, []));
}

function hasCompleteSecretMatches(text, values, matchEnds) {
  if (!Array.isArray(matchEnds) || matchEnds.length !== text.length + 1) return false;
  for (let index = 0; index < text.length; index += 1) {
    const end = matchEnds[index];
    if (
      !Object.hasOwn(matchEnds, index) ||
      !Number.isSafeInteger(end) ||
      end < 0 ||
      end > text.length
    )
      return false;
  }
  for (const secret of values) {
    let start = text.indexOf(secret);
    while (start >= 0) {
      if (matchEnds[start] < start + secret.length) return false;
      start = text.indexOf(secret, start + 1);
    }
  }
  return true;
}
