import { createSecretTextMatcher } from "../../secret-text-matcher.mjs";
import { createBoundedSecretSearch } from "../../bounded-secret-search.mjs";
import { createPartialSecretSuffixTrimmer } from "../../partial-secret-suffix-trimmer.mjs";
import { normalizeRedactionPolicySecrets } from "../../../normalize-redaction-policy-secrets.mjs";
import { createSuppressedPolicy } from "./suppressed-policy.mjs";
import { MAX_SECRET_SEARCH_WORK_PER_CHUNK, resolveRedactedStreamBounds } from "./bounds.mjs";

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
  let suppressed = maximumSecretLength > boundedOutputLimit;
  const trimSuffix = suppressed ? null : createPartialSecretSuffixTrimmer(values);
  if (!trimSuffix) suppressed = true;
  let findSecretEnds = null;
  if (!suppressed) {
    const matcher = getSecretMatcher
      ? getSecretMatcher(values, { maxScanWork: workLimit })
      : createSecretTextMatcher(values, values.length === 0 ? {} : { maxScanWork: workLimit });
    if (typeof matcher === "function") findSecretEnds = matcher;
    else suppressed = true;
  }
  const findSafeBoundary = suppressed
    ? null
    : createBoundedSecretSearch(values, workLimit, findSecretEnds);
  return {
    workLimit,
    pendingLimit,
    values,
    trimSuffix,
    findSecretEnds,
    findSafeBoundary,
    suppressed,
  };
}
