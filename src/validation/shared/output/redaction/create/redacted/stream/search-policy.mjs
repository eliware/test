import { createSecretTextMatcher } from "../../secret-text-matcher.mjs";
import { createBoundedSecretSearch } from "../../bounded-secret-search.mjs";
import { createPartialSecretSuffixTrimmer } from "../../partial-secret-suffix-trimmer.mjs";
import { isRedactedStreamPolicySuppressed } from "./is-policy-suppressed.mjs";

export function createRedactedSearchPolicy(
  values,
  maximumSecretLength,
  outputLimit,
  workLimit,
  getSecretMatcher,
) {
  const trimSuffix =
    maximumSecretLength <= outputLimit ? createPartialSecretSuffixTrimmer(values) : null;
  let findSecretEnds = null;
  if (trimSuffix) {
    const matcher = getSecretMatcher
      ? getSecretMatcher(values, { maxScanWork: workLimit })
      : createSecretTextMatcher(values, values.length === 0 ? {} : { maxScanWork: workLimit });
    if (typeof matcher === "function") findSecretEnds = matcher;
  }
  const suppressed = isRedactedStreamPolicySuppressed(
    maximumSecretLength,
    outputLimit,
    trimSuffix,
    findSecretEnds,
  );
  return {
    trimSuffix,
    findSecretEnds,
    findSafeBoundary: suppressed
      ? null
      : createBoundedSecretSearch(values, workLimit, findSecretEnds),
    suppressed,
  };
}
