export const DEFAULT_PENDING_LENGTH = 64_000;
export default function resolvePendingLimit(outputLimit, maxPendingLength, maximumSecretLength) {
  maxPendingLength ??= DEFAULT_PENDING_LENGTH;
  return Math.min(
    Math.max(1, outputLimit),
    Math.max(1, Math.floor(maxPendingLength), maximumSecretLength),
  );
}
