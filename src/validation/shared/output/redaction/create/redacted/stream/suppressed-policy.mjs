export function createSuppressedPolicy(values, outputLimit, workLimit, maxPendingLength) {
  if (values) return null;
  return {
    outputLimit,
    workLimit,
    pendingLimit: Math.min(Math.max(1, Math.floor(outputLimit)), Math.max(1, maxPendingLength)),
    values: [],
    trimSuffix: null,
    findSecretEnds: null,
    findSafeBoundary: null,
    suppressed: true,
  };
}
