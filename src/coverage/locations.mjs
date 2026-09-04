import { isCoveredCount } from './percentages.mjs';

/** Return source locations for counters that were never executed. */
export function locationsForCounts(map, counts) {
  return Object.entries(counts)
    .filter(([, count]) => !isCoveredCount(count))
    .map(([id]) => map[id] ?? {});
}
