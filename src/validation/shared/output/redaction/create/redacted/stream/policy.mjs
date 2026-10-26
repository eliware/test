import { normalizeRedactedStreamPolicy } from "./policy-normalization.mjs";
import { buildRedactedStreamPolicy } from "./build-policy.mjs";

export function createRedactedStreamPolicy(
  secrets,
  outputLimit,
  { maxSearchWorkPerChunk, maxPendingLength, getSecretMatcher } = {},
) {
  const normalized = normalizeRedactedStreamPolicy(secrets, outputLimit, {
    maxSearchWorkPerChunk,
    maxPendingLength,
  });
  return buildRedactedStreamPolicy(normalized, getSecretMatcher);
}
