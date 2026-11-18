import normalizeRedactionPolicySecrets from "../../../../normalize-redaction-policy-secrets.mjs";
import { MAX_SECRET_SEARCH_WORK_PER_CHUNK } from "../bounds.mjs";
import resolveRedactedStreamBounds from "../bounds.mjs";
import { DEFAULT_PENDING_LENGTH } from "../bounds/pending-limit.mjs";
export default function normalizeRedactedStreamSecretBounds(
  secrets,
  outputLimit,
  maxSearchWorkPerChunk = MAX_SECRET_SEARCH_WORK_PER_CHUNK,
  maxPendingLength = DEFAULT_PENDING_LENGTH,
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
  return {
    values,
    maximumSecretLength,
    bounds,
  };
}
