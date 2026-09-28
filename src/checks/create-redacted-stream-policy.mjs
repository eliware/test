import { createSecretTextMatcher } from "./create-secret-text-matcher.mjs";
import { createBoundedSecretSearch } from "./create-bounded-secret-search.mjs";
import { createPartialSecretSuffixTrimmer } from "./create-partial-secret-suffix-trimmer.mjs";

const MAX_SECRET_SEARCH_WORK_PER_CHUNK = 1_000_000;
const MAX_RETAINED_PENDING_LENGTH = 64_000;

export function createRedactedStreamPolicy(
  secrets,
  outputLimit,
  {
    maxSearchWorkPerChunk = MAX_SECRET_SEARCH_WORK_PER_CHUNK,
    maxPendingLength = MAX_RETAINED_PENDING_LENGTH,
    getSecretMatcher,
  } = {},
) {
  const workLimit = Math.min(MAX_SECRET_SEARCH_WORK_PER_CHUNK, Math.max(1, maxSearchWorkPerChunk));
  const pendingLimit = Math.min(
    MAX_RETAINED_PENDING_LENGTH,
    Math.max(1, Math.floor(maxPendingLength)),
  );
  const values = [...new Set(secrets.filter((secret) => typeof secret === "string" && secret))];
  const maximumSecretLength = values.reduce(
    (maximum, secret) => Math.max(maximum, secret.length),
    0,
  );
  let suppressed = maximumSecretLength > outputLimit || maximumSecretLength > pendingLimit;
  const trimSuffix = suppressed ? null : createPartialSecretSuffixTrimmer(values);
  if (!trimSuffix) suppressed = true;
  const findSecretEnds = suppressed
    ? null
    : getSecretMatcher
      ? getSecretMatcher(values, { maxScanWork: workLimit })
      : createSecretTextMatcher(values, values.length === 0 ? {} : { maxScanWork: workLimit });
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
