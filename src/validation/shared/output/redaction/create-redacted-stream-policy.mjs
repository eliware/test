import { createSecretTextMatcher } from "./create-secret-text-matcher.mjs";
import { createBoundedSecretSearch } from "./create-bounded-secret-search.mjs";
import { createPartialSecretSuffixTrimmer } from "./create-partial-secret-suffix-trimmer.mjs";

const MAX_SECRET_SEARCH_WORK_PER_CHUNK = 1_000_000;
const DEFAULT_PENDING_LENGTH = 64_000;
const MAX_POLICY_SECRET_COUNT = 10_000;
const MAX_POLICY_SECRET_INPUT_COUNT = 10_000;
const MAX_POLICY_SECRET_LENGTH = 166_666;
export function createRedactedStreamPolicy(
  secrets,
  outputLimit,
  {
    maxSearchWorkPerChunk = MAX_SECRET_SEARCH_WORK_PER_CHUNK,
    maxPendingLength = DEFAULT_PENDING_LENGTH,
    getSecretMatcher,
  } = {},
) {
  const finiteWorkLimit = Number.isFinite(maxSearchWorkPerChunk)
    ? maxSearchWorkPerChunk
    : MAX_SECRET_SEARCH_WORK_PER_CHUNK;
  const workLimit = Math.min(MAX_SECRET_SEARCH_WORK_PER_CHUNK, Math.max(1, finiteWorkLimit));
  const uniqueSecrets = new Set();
  let totalSecretLength = 0;
  let secretInputCount = 0;
  for (const secret of secrets) {
    secretInputCount += 1;
    if (secretInputCount > MAX_POLICY_SECRET_INPUT_COUNT)
      return createSuppressedPolicy(outputLimit, workLimit, maxPendingLength);
    if (typeof secret !== "string" || !secret || uniqueSecrets.has(secret)) continue;
    totalSecretLength += secret.length;
    if (
      uniqueSecrets.size >= MAX_POLICY_SECRET_COUNT ||
      totalSecretLength > MAX_POLICY_SECRET_LENGTH
    )
      return createSuppressedPolicy(outputLimit, workLimit, maxPendingLength);
    uniqueSecrets.add(secret);
  }
  const values = [...uniqueSecrets].sort((left, right) => right.length - left.length);
  const maximumSecretLength = values.reduce(
    (maximum, secret) => Math.max(maximum, secret.length),
    0,
  );
  // codescope ignore this because pendingLimit is clamped to the output budget before use.
  const pendingLimit = Math.min(
    Math.max(1, Math.floor(outputLimit)),
    Math.max(1, Math.floor(maxPendingLength), maximumSecretLength),
  );
  // codescope ignore this because secrets longer than the output limit suppress the stream first.
  let suppressed = maximumSecretLength > outputLimit;
  // codescope ignore: the trimmer uses a fixed work budget and returns a function for empty secrets.
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

function createSuppressedPolicy(outputLimit, workLimit, maxPendingLength) {
  return {
    workLimit,
    pendingLimit: Math.min(Math.max(1, Math.floor(outputLimit)), Math.max(1, maxPendingLength)),
    values: [],
    trimSuffix: null,
    findSecretEnds: null,
    findSafeBoundary: null,
    suppressed: true,
  };
}
