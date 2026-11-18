import createSuppressedPolicy from "./policy-normalization/suppressed-policy.mjs";
import normalizeRedactedStreamSecretBounds from "./policy-normalization/secret-bounds.mjs";
export default function normalizeRedactedStreamPolicy(
  secrets,
  outputLimit,
  { maxSearchWorkPerChunk, maxPendingLength } = {},
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
    normalized.bounds.pendingLimit,
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
