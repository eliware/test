import { normalizeRedactionPolicySecrets } from "../../../../normalize-redaction-policy-secrets.mjs";
import { MAX_SECRET_SEARCH_WORK_PER_CHUNK, resolveRedactedStreamBounds } from "../bounds.mjs";

export function normalizeRedactedStreamSecretBounds(
  secrets,
  outputLimit,
  maxSearchWorkPerChunk = MAX_SECRET_SEARCH_WORK_PER_CHUNK,
  maxPendingLength = 64_000,
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
  return { values, maximumSecretLength, bounds };
}
