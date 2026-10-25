import { createSuppressedPolicy } from "./suppressed-policy.mjs";
import { normalizeRedactedStreamSecretBounds } from "./policy-normalization/secret-bounds.mjs";

const DEFAULT_PENDING_LENGTH = 64_000;

export function normalizeRedactedStreamPolicy(
  secrets,
  outputLimit,
  { maxSearchWorkPerChunk, maxPendingLength = DEFAULT_PENDING_LENGTH } = {},
) {
  const normalized = normalizeRedactedStreamSecretBounds(
    secrets,
    outputLimit,
    maxSearchWorkPerChunk,
    maxPendingLength,
  );
  const suppressedPolicy = createSuppressedPolicy(
    normalized.values,
    normalized.bounds.outputLimit,
    normalized.bounds.workLimit,
    maxPendingLength,
  );

  return {
    maximumSecretLength: normalized.maximumSecretLength,
    policy: suppressedPolicy ?? {
      outputLimit: normalized.bounds.outputLimit,
      workLimit: normalized.bounds.workLimit,
      pendingLimit: normalized.bounds.pendingLimit,
      values: normalized.values,
    },
  };
}
