import { createRedactedSearchPolicy } from "./search-policy.mjs";
import { normalizeRedactedStreamPolicy } from "./policy-normalization.mjs";

export function createRedactedStreamPolicy(
  secrets,
  outputLimit,
  { maxSearchWorkPerChunk, maxPendingLength, getSecretMatcher } = {},
) {
  const normalized = normalizeRedactedStreamPolicy(secrets, outputLimit, {
    maxSearchWorkPerChunk,
    maxPendingLength,
  });
  if (normalized.policy.suppressed) return normalized.policy;
  return {
    ...normalized.policy,
    ...createRedactedSearchPolicy(
      normalized.policy.values,
      normalized.maximumSecretLength,
      normalized.policy.outputLimit,
      normalized.policy.workLimit,
      getSecretMatcher,
    ),
  };
}
