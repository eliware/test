import { createRedactedStreamPolicy } from "../stream/policy.mjs";
import { createRedactedTextStreamController } from "./stream-controller.mjs";
import { redactCompleteOutput } from "../../../redact/complete-output.mjs";

const DEFAULT_OUTPUT_LIMIT = 100_000;

export function createRedactedTextStream(
  secrets,
  outputLimit,
  { maxSearchWorkPerChunk, maxPendingLength, getSecretMatcher } = {},
) {
  const policy = createRedactedStreamPolicy(secrets, outputLimit ?? DEFAULT_OUTPUT_LIMIT, {
    maxSearchWorkPerChunk,
    maxPendingLength,
    getSecretMatcher,
  });
  const session = createRedactedTextStreamController(policy, policy.outputLimit);

  return {
    redactComplete(text) {
      return redactCompleteOutput(text, policy);
    },
    push: session.push,
    finish: session.finish,
  };
}
