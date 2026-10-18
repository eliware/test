import { redactProcessOutput } from "../../../redact/process-output.mjs";
import { redactMatchedSecrets } from "../../../redact/secrets.mjs";
import { truncateRedactedOutput } from "../../../truncate-redacted-output.mjs";
import { truncateOutputTextToBytes } from "../../output-byte-budget.mjs";

export function createRedactedStreamOutput(outputLimit) {
  let outputLength = 0;

  function append(text, matchEnds) {
    const remaining = Math.max(0, outputLimit - outputLength);
    const redacted = redactProcessOutput(redactMatchedSecrets(text, matchEnds), []);
    const byteBounded = truncateOutputTextToBytes(redacted, remaining);
    const output = truncateRedactedOutput(redacted, byteBounded.text.length);

    outputLength += Buffer.byteLength(output, "utf8");
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
