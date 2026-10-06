import { redactProcessOutput } from "./redact-process-output.mjs";
import { redactMatchedSecrets } from "./redact-secrets.mjs";
import { truncateRedactedOutput } from "./truncate-redacted-output.mjs";
import { truncateOutputTextToBytes } from "./create-output-byte-budget.mjs";

export function createRedactedStreamOutput(outputLimit) {
  // Keep the stream bound aligned with the aggregate UTF-8 byte budget.
  let outputLength = 0;

  function append(text, matchEnds) {
    const remaining = Math.max(0, outputLimit - outputLength);
    const redacted = redactProcessOutput(redactMatchedSecrets(text, matchEnds), []);
    const byteBounded = truncateOutputTextToBytes(redacted, remaining);
    const output = truncateRedactedOutput(redacted, byteBounded.text.length);
    // Any removed suffix is a partial ASCII redaction marker, so character and byte counts match.
    outputLength += byteBounded.byteLength - (byteBounded.text.length - output.length);
    return output;
  }

  return {
    append,
    canContinue: () => outputLength < outputLimit,
    get outputLength() {
      return outputLength;
    },
  };
}
