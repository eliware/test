import { createSecretTextMatcher } from "../../secret-text-matcher.mjs";
import { createBoundedSecretSearch } from "../../bounded-secret-search.mjs";
import { createPartialSecretSuffixTrimmer } from "../../partial-secret-suffix-trimmer.mjs";
import { normalizeRedactionPolicySecrets } from "../../../normalize-redaction-policy-secrets.mjs";
import { createSuppressedPolicy } from "./suppressed-policy.mjs";

const MAX_SECRET_SEARCH_WORK_PER_CHUNK = 1_000_000;
const DEFAULT_PENDING_LENGTH = 64_000;
const DEFAULT_OUTPUT_LIMIT = 100_000;
const MAX_OUTPUT_LIMIT = 1_000_000;
export function createRedactedStreamPolicy(
  secrets,
  outputLimit,
  {
    maxSearchWorkPerChunk = MAX_SECRET_SEARCH_WORK_PER_CHUNK,
    maxPendingLength = DEFAULT_PENDING_LENGTH,
    getSecretMatcher,
  } = {},
) {
  const boundedOutputLimit = Number.isFinite(outputLimit)
    ? Math.max(0, Math.min(Math.floor(outputLimit), MAX_OUTPUT_LIMIT))
    : DEFAULT_OUTPUT_LIMIT;
  const finiteWorkLimit = Number.isFinite(maxSearchWorkPerChunk)
    ? maxSearchWorkPerChunk
    : MAX_SECRET_SEARCH_WORK_PER_CHUNK;
  const workLimit = Math.min(MAX_SECRET_SEARCH_WORK_PER_CHUNK, Math.max(1, finiteWorkLimit));
  const values = normalizeRedactionPolicySecrets(secrets);
  if (!values) return createSuppressedPolicy(boundedOutputLimit, workLimit, maxPendingLength);
  const maximumSecretLength = values.reduce(
    (maximum, secret) => Math.max(maximum, secret.length),
    0,
  );
  const pendingLimit = Math.min(
    Math.max(1, boundedOutputLimit),
    Math.max(1, Math.floor(maxPendingLength), maximumSecretLength),
  );
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
