export const MAX_SECRET_SEARCH_WORK_PER_CHUNK = 1_000_000;
const DEFAULT_OUTPUT_LIMIT = 100_000;
const MAX_OUTPUT_LIMIT = 1_000_000;

export function resolveRedactedStreamBounds(
  outputLimit,
  maxSearchWorkPerChunk,
  maxPendingLength,
  maximumSecretLength,
) {
  const boundedOutputLimit = Number.isFinite(outputLimit)
    ? Math.max(0, Math.min(Math.floor(outputLimit), MAX_OUTPUT_LIMIT))
    : DEFAULT_OUTPUT_LIMIT;
  const finiteWorkLimit = Number.isFinite(maxSearchWorkPerChunk)
    ? maxSearchWorkPerChunk
    : MAX_SECRET_SEARCH_WORK_PER_CHUNK;
  const workLimit = Math.min(MAX_SECRET_SEARCH_WORK_PER_CHUNK, Math.max(1, finiteWorkLimit));
  const pendingLimit = Math.min(
    Math.max(1, boundedOutputLimit),
    Math.max(1, Math.floor(maxPendingLength), maximumSecretLength),
  );
  return { outputLimit: boundedOutputLimit, workLimit, pendingLimit };
}
