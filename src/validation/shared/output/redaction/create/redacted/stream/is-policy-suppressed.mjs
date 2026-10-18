export function isRedactedStreamPolicySuppressed(
  maximumSecretLength,
  outputLimit,
  trimSuffix,
  findSecretEnds,
) {
  return maximumSecretLength > outputLimit || !trimSuffix || typeof findSecretEnds !== "function";
}
