import { redactProcessOutput } from "./redact-process-output.mjs";
import { redactMatchedSecrets } from "./redact-secrets.mjs";
import { truncateRedactedOutput } from "./truncate-redacted-output.mjs";

export function createRedactedStreamOutput(outputLimit) {
  // This intermediate buffer counts UTF-16 code units.
  // The process-output caller applies the final UTF-8 byte budget.
  let outputLength = 0;

  function append(text, matchEnds) {
    const remaining = Math.max(0, outputLimit - outputLength);
    const output = truncateRedactedOutput(
      redactProcessOutput(redactMatchedSecrets(text, matchEnds), []),
      remaining,
    );
    outputLength += output.length;
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
