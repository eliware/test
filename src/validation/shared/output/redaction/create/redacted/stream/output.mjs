import { truncateRedactedOutput } from "../../../truncate-redacted-output.mjs";
import { createOutputByteBudget, truncateOutputTextToBytes } from "../../output-byte-budget.mjs";
import { redactStreamOutput } from "./redact-output.mjs";

export function createRedactedStreamOutput(outputLimit) {
  const budget = createOutputByteBudget(outputLimit);

  function append(text, matchEnds) {
    const redacted = redactStreamOutput(text, matchEnds);
    const byteBounded = truncateOutputTextToBytes(redacted, budget.remaining);
    const output = truncateRedactedOutput(redacted, byteBounded.text.length);
    return budget.append("stdout", output);
  }

  return {
    append,
    canContinue: () => !budget.isFull(),
    get outputLength() {
      return budget.capturedBytes;
    },
  };
}
