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
      return redactCompleteOutput(text, { ...policy, suppressed: session.suppressed });
    },
    push: session.push,
    finish: session.finish,
  };
}
