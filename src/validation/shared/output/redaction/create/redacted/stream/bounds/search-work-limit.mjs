export const MAX_SECRET_SEARCH_WORK_PER_CHUNK = 1_000_000;

export function resolveSearchWorkLimit(maxSearchWorkPerChunk) {
  const finiteLimit = Number.isFinite(maxSearchWorkPerChunk)
    ? maxSearchWorkPerChunk
    : MAX_SECRET_SEARCH_WORK_PER_CHUNK;
  return Math.min(MAX_SECRET_SEARCH_WORK_PER_CHUNK, Math.max(1, finiteLimit));
}
