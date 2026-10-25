import { normalizeRedactionPolicySecrets } from "../../../normalize-redaction-policy-secrets.mjs";
import { createSuppressedPolicy } from "./suppressed-policy.mjs";
import { MAX_SECRET_SEARCH_WORK_PER_CHUNK, resolveRedactedStreamBounds } from "./bounds.mjs";

const DEFAULT_PENDING_LENGTH = 64_000;

export function normalizeRedactedStreamPolicy(
  secrets,
  outputLimit,
  {
    maxSearchWorkPerChunk = MAX_SECRET_SEARCH_WORK_PER_CHUNK,
    maxPendingLength = DEFAULT_PENDING_LENGTH,
  } = {},
) {
  const values = normalizeRedactionPolicySecrets(secrets);
  const maximumSecretLength =
    values?.reduce((maximum, secret) => Math.max(maximum, secret.length), 0) ?? 0;
  const bounds = resolveRedactedStreamBounds(
    outputLimit,
    maxSearchWorkPerChunk,
    maxPendingLength,
    maximumSecretLength,
  );
  const suppressedPolicy = createSuppressedPolicy(
    values,
    bounds.outputLimit,
    bounds.workLimit,
    maxPendingLength,
  );

  return {
    maximumSecretLength,
    policy: suppressedPolicy ?? {
      outputLimit: bounds.outputLimit,
      workLimit: bounds.workLimit,
      pendingLimit: bounds.pendingLimit,
      values,
    },
  };
}
