import { isCoveredCount } from './percentages.mjs';

export function uncoveredBranches(branchMap, id, counts) {
  if (!Array.isArray(counts)) return [{ type: 'branch' }];
  const branch = branchMap?.[id];
  if (branch?.type === 'default-arg' && Array.isArray(branch.locations) && branch.locations.length > 0) return [];
  if (!branch || typeof branch !== 'object') return counts.filter((count) => !isCoveredCount(count)).map(() => ({ type: 'branch' }));
  return counts.flatMap((count, index) => {
    const location = branch.locations?.[index];
    return isCoveredCount(count) ? [] : [{ ...(location ?? { unknown: true }), type: branch.type ?? 'branch' }];
  });
}
