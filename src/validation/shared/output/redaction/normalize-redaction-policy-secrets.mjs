const MAX_POLICY_SECRET_COUNT = 10_000;
const MAX_POLICY_SECRET_INPUT_COUNT = 10_000;
const MAX_POLICY_SECRET_LENGTH = 166_666;

export function normalizeRedactionPolicySecrets(secrets) {
  const uniqueSecrets = new Set();
  let totalSecretLength = 0;
  let secretInputCount = 0;
  for (const secret of secrets) {
    secretInputCount += 1;
    if (secretInputCount > MAX_POLICY_SECRET_INPUT_COUNT) return null;
    if (typeof secret !== "string" || !secret || uniqueSecrets.has(secret)) continue;
    totalSecretLength += secret.length;
    if (
      uniqueSecrets.size >= MAX_POLICY_SECRET_COUNT ||
      totalSecretLength > MAX_POLICY_SECRET_LENGTH
    )
      return null;
    uniqueSecrets.add(secret);
  }
  return [...uniqueSecrets].sort((left, right) => right.length - left.length);
}
