export function isCoveredCount(value) {
  return Number.isFinite(value) && value > 0;
}

export function percentage(counts) {
  if (counts === undefined || counts === null || typeof counts !== 'object' || Array.isArray(counts)) return 0;
  let total = 0;
  let covered = 0;
  for (const count of Object.values(Object(counts))) {
    const values = Array.isArray(count) ? count : [count];
    for (const value of values) { total += 1; if (isCoveredCount(value)) covered += 1; }
  }
  if (total === 0) return 100;
  return Math.round((covered / total) * 10000) / 100;
}

export function percentageWithUnknowns(lineCounts, unknownCount) {
  if (!Number.isFinite(unknownCount) || !Number.isInteger(unknownCount) || unknownCount < 0) throw new TypeError('unknownCount must be a finite non-negative integer');
  const mapped = [...lineCounts.values()];
  const total = mapped.length + unknownCount;
  if (total === 0) return 100;
  return Math.round((mapped.filter(isCoveredCount).length / total) * 10000) / 100;
}
