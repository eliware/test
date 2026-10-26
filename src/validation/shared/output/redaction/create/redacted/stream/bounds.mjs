import { resolveOutputLimit } from "./bounds/output-limit.mjs";
import { resolveSearchWorkLimit } from "./bounds/search-work-limit.mjs";
import { resolvePendingLimit } from "./bounds/pending-limit.mjs";

export { MAX_SECRET_SEARCH_WORK_PER_CHUNK } from "./bounds/search-work-limit.mjs";

export function resolveRedactedStreamBounds(
  outputLimit,
  maxSearchWorkPerChunk,
  maxPendingLength,
  maximumSecretLength,
) {
  const boundedOutputLimit = resolveOutputLimit(outputLimit);
  const workLimit = resolveSearchWorkLimit(maxSearchWorkPerChunk);
  const pendingLimit = resolvePendingLimit(
    boundedOutputLimit,
    maxPendingLength,
    maximumSecretLength,
  );
  return { outputLimit: boundedOutputLimit, workLimit, pendingLimit };
}
