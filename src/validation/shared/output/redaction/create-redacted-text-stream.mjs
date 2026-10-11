import { createRedactedStreamPolicy } from "./create-redacted-stream-policy.mjs";
import { createRedactedTextStreamSession } from "./create-redacted-text-stream-controller.mjs";
import { redactCompleteOutput } from "./redact-complete-output.mjs";

const DEFAULT_OUTPUT_LIMIT = 100_000;
const MAX_OUTPUT_LIMIT = 1_000_000;

export function createRedactedTextStream(
  secrets,
  outputLimit,
  { maxSearchWorkPerChunk, maxPendingLength, getSecretMatcher } = {},
) {
  const boundedOutputLimit = Number.isFinite(outputLimit)
    ? Math.max(0, Math.min(Math.floor(outputLimit), MAX_OUTPUT_LIMIT))
    : DEFAULT_OUTPUT_LIMIT;
  const policy = createRedactedStreamPolicy(secrets, boundedOutputLimit, {
    maxSearchWorkPerChunk,
    maxPendingLength,
    getSecretMatcher,
  });
  const session = createRedactedTextStreamSession(policy, boundedOutputLimit);

  return {
    redactComplete(text) {
      // codescope ignore this because complete output has its own bounded matcher and suppression state.
      return redactCompleteOutput(text, policy);
    },
    push: session.push,
    finish: session.finish,
  };
}
