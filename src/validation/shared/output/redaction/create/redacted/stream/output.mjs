import { createOutputByteBudget } from "../../output-byte-budget.mjs";
import { appendRedactedOutput } from "./append-redacted-output.mjs";

export function createRedactedStreamOutput(outputLimit) {
  const budget = createOutputByteBudget(outputLimit);

  return {
    append: (text, matchEnds) => appendRedactedOutput(text, matchEnds, budget),
    canContinue: () => !budget.isFull(),
    get outputLength() {
      return budget.capturedBytes;
    },
  };
}
