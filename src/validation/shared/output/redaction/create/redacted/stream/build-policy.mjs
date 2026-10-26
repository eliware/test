import { createRedactedSearchPolicy } from "./search-policy.mjs";

export function buildRedactedStreamPolicy(normalized, getSecretMatcher) {
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
