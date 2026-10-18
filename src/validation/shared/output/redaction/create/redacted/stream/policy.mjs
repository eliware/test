import { normalizeRedactionPolicySecrets } from "../../../normalize-redaction-policy-secrets.mjs";
import { createSuppressedPolicy } from "./suppressed-policy.mjs";
import { MAX_SECRET_SEARCH_WORK_PER_CHUNK, resolveRedactedStreamBounds } from "./bounds.mjs";
import { createRedactedSearchPolicy } from "./search-policy.mjs";

const DEFAULT_PENDING_LENGTH = 64_000;
export function createRedactedStreamPolicy(
  secrets,
  outputLimit,
  {
    maxSearchWorkPerChunk = MAX_SECRET_SEARCH_WORK_PER_CHUNK,
    maxPendingLength = DEFAULT_PENDING_LENGTH,
    getSecretMatcher,
  } = {},
) {
  const values = normalizeRedactionPolicySecrets(secrets);
  const maximumSecretLength =
    values?.reduce((maximum, secret) => Math.max(maximum, secret.length), 0) ?? 0;
  const {
    outputLimit: boundedOutputLimit,
    workLimit,
    pendingLimit,
  } = resolveRedactedStreamBounds(
    outputLimit,
    maxSearchWorkPerChunk,
    maxPendingLength,
    maximumSecretLength,
  );
  if (!values) return createSuppressedPolicy(boundedOutputLimit, workLimit, maxPendingLength);
  return {
    workLimit,
    pendingLimit,
    values,
    ...createRedactedSearchPolicy(
      values,
      maximumSecretLength,
      boundedOutputLimit,
      workLimit,
      getSecretMatcher,
    ),
  };
}
