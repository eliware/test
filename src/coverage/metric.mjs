export function metricHasGap(value) {
  if (typeof value !== 'string' || value.length > 2048) return true;
  const match = value.trim().match(/^(\d+)\s*\/\s*(\d+)$/);
  if (match) { const covered = BigInt(match[1]); const total = BigInt(match[2]); return total <= 0n || covered > total || covered !== total; }
  const annotated = value.trim().match(/^(\d+(?:\.\d+)?)\s*%\s*\((\d+)\s*\/\s*(\d+)\)$/);
  if (annotated) { const displayed = percentageHundredths(annotated[1]); const covered = BigInt(annotated[2]); const total = BigInt(annotated[3]); if (total <= 0n || covered > total) return true; return covered !== total || displayed === null || displayed !== (covered * 10000n + total / 2n) / total; }
  const percentage = value.trim().match(/^(\d+(?:\.\d+)?)\s*%$/);
  if (percentage) return !isExactHundred(percentage[1]);
  const numeric = value.trim().match(/^\d+(?:\.\d+)?$/);
  return numeric ? !isExactHundred(numeric[0]) : true;
}
function isExactHundred(value) { return /^100(?:\.0*)?$/.test(value); }
function percentageHundredths(value) { const [whole, fraction = ''] = value.split('.'); if (whole.length > 3 || BigInt(whole) > 100n || (whole === '100' && /[1-9]/.test(fraction)) || fraction.length > 1024) return null; let result = BigInt(whole) * 100n + BigInt(fraction.slice(0, 2).padEnd(2, '0')); if (fraction.length > 2 && fraction[2] >= '5') result += 1n; return result === 10000n && whole !== '100' ? null : result; }
