import { StringDecoder } from "node:string_decoder";
import { redactProcessOutput } from "./redact-process-output.mjs";
import { createSecretTextMatcher } from "./create-secret-text-matcher.mjs";
import { createBoundedSecretSearch } from "./create-bounded-secret-search.mjs";
import { createPartialSecretSuffixTrimmer } from "./create-partial-secret-suffix-trimmer.mjs";
import { redactMatchedSecrets } from "./redact-secrets.mjs";
import { truncateRedactedOutput } from "./truncate-redacted-output.mjs";

const MAX_SECRET_SEARCH_WORK_PER_CHUNK = 1_000_000;
const MAX_RETAINED_PENDING_LENGTH = 64_000;

export function createRedactedTextStream(
  secrets,
  outputLimit,
  { maxSearchWorkPerChunk = MAX_SECRET_SEARCH_WORK_PER_CHUNK } = {},
) {
  const workLimit = Math.min(MAX_SECRET_SEARCH_WORK_PER_CHUNK, Math.max(1, maxSearchWorkPerChunk));
  const values = [
    ...new Set(secrets.filter((secret) => typeof secret === "string" && secret.length > 0)),
  ];
  const maximumSecretLength = Math.max(0, ...values.map((secret) => secret.length));
  let suppressed =
    maximumSecretLength > outputLimit || maximumSecretLength > MAX_RETAINED_PENDING_LENGTH;
  const trimSuffix = suppressed ? null : createPartialSecretSuffixTrimmer(values);
  if (!trimSuffix) suppressed = true;
  const findSecretEnds = suppressed
    ? null
    : createSecretTextMatcher(values, { maxScanWork: workLimit });
  const decoder = new StringDecoder("utf8");
  let pending = "";
  let outputLength = 0;
  let finished = false;
  const findSafeBoundary = suppressed
    ? null
    : createBoundedSecretSearch(values, workLimit, findSecretEnds);

  function append(text, matchEnds) {
    const remaining = Math.max(0, outputLimit - outputLength);
    const output = truncateRedactedOutput(
      redactProcessOutput(redactMatchedSecrets(text, matchEnds), []),
      remaining,
    );
    outputLength += output.length;
    return output;
  }

  function addText(text) {
    if (suppressed || finished || outputLength >= outputLimit) return "";
    let output = "";
    for (
      let start = 0;
      start < text.length && !suppressed && outputLength < outputLimit;
      start += MAX_RETAINED_PENDING_LENGTH
    ) {
      pending += text.slice(start, start + MAX_RETAINED_PENDING_LENGTH);
      const { boundary, matchEnds, suppressed: searchSuppressed } = findSafeBoundary(pending);
      if (searchSuppressed) {
        suppressed = true;
        pending = "";
        return "";
      }
      if (boundary === 0) continue;
      const safeText = pending.slice(0, boundary);
      pending = pending.slice(boundary);
      output += append(safeText, matchEnds);
    }
    return output;
  }

  return {
    redactComplete(text) {
      const value = String(text);
      if (suppressed || values.length * value.length > workLimit) return "";
      const matchEnds = findSecretEnds(value);
      if (matchEnds === null) return "";
      const redacted = redactMatchedSecrets(value, matchEnds);
      return trimSuffix(redactProcessOutput(redacted, []));
    },
    push(chunk) {
      const text = decoder.write(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
      return addText(text);
    },
    finish() {
      if (finished) return "";
      finished = true;
      if (suppressed || outputLength >= outputLimit) return "";
      pending += decoder.end();
      const { matchEnds, suppressed: searchSuppressed } = findSafeBoundary(pending, true);
      if (searchSuppressed) {
        suppressed = true;
        pending = "";
        return "";
      }
      const redacted = redactMatchedSecrets(pending, matchEnds);
      const safeText = trimSuffix(redacted);
      pending = "";
      return append(safeText, []);
    },
  };
}
