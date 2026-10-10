import { createRedactedStreamPolicy } from "./create-redacted-stream-policy.mjs";
import { createRedactedTextStreamSession } from "./create-redacted-text-stream-controller.mjs";
import { redactCompleteOutput } from "./redact-complete-output.mjs";

export function createRedactedTextStream(
  secrets,
  outputLimit,
  { maxSearchWorkPerChunk, maxPendingLength, getSecretMatcher } = {},
) {
  const policy = createRedactedStreamPolicy(secrets, outputLimit, {
    maxSearchWorkPerChunk,
    maxPendingLength,
    getSecretMatcher,
  });
  const session = createRedactedTextStreamSession(policy, outputLimit);

  return {
    redactComplete(text) {
      // codescope ignore this because complete output has its own bounded matcher and suppression state.
      return redactCompleteOutput(text, policy);
    },
    push: session.push,
    finish: session.finish,
  };
}
