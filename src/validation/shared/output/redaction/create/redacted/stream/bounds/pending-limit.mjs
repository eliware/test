export function resolvePendingLimit(outputLimit, maxPendingLength, maximumSecretLength) {
  return Math.min(
    Math.max(1, outputLimit),
    Math.max(1, Math.floor(maxPendingLength), maximumSecretLength),
  );
}
