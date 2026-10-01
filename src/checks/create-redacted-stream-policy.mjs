import { createSecretTextMatcher } from "./create-secret-text-matcher.mjs";
import { createBoundedSecretSearch } from "./create-bounded-secret-search.mjs";
import { createPartialSecretSuffixTrimmer } from "./create-partial-secret-suffix-trimmer.mjs";

const MAX_SECRET_SEARCH_WORK_PER_CHUNK = 1_000_000;
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
  const workLimit = Math.min(MAX_SECRET_SEARCH_WORK_PER_CHUNK, Math.max(1, maxSearchWorkPerChunk));
  const values = [...new Set(secrets.filter((secret) => typeof secret === "string" && secret))];
  const maximumSecretLength = values.reduce(
    (maximum, secret) => Math.max(maximum, secret.length),
    0,
  );
  const pendingLimit = Math.min(
    Math.max(1, Math.floor(outputLimit)),
    Math.max(1, Math.floor(maxPendingLength), maximumSecretLength),
  );
  let suppressed = maximumSecretLength > outputLimit;
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
