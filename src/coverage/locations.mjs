import { isCoveredCount } from './percentages.mjs';

/** Return source locations for counters that were never executed. */
export function locationsForCounts(map, counts) {
  if (!counts || typeof counts !== 'object' || Array.isArray(counts)) return [{ unknown: true }];
  const locations = map && typeof map === 'object' && !Array.isArray(map) ? map : {};
  return Object.entries(counts)
    .filter(([, count]) => !isCoveredCount(count))
    .map(([id]) => locations[id] ?? { unknown: true });
}
