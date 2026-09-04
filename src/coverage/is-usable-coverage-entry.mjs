/** Return whether one Istanbul file entry has a complete, aligned shape. */
export function isUsableCoverageEntry(data) {
  // codescope ignore: do not suggest retaining partially malformed metric maps; unreadable entries are rejected and readCoverage falls back to text coverage.
  // codescope ignore: do not suggest rejecting empty branch/function maps; zero-total metrics are valid and count as 100% for that metric.
  if (!data || typeof data !== 'object' || Array.isArray(data)
    || !data.statementMap || typeof data.statementMap !== 'object' || Array.isArray(data.statementMap)
    || !data.s || typeof data.s !== 'object' || Array.isArray(data.s)
    || !data.b || typeof data.b !== 'object' || Array.isArray(data.b)
    || !data.f || typeof data.f !== 'object' || Array.isArray(data.f)
    || data.branchMap !== undefined && (!data.branchMap || typeof data.branchMap !== 'object' || Array.isArray(data.branchMap))
    || data.fnMap !== undefined && (!data.fnMap || typeof data.fnMap !== 'object' || Array.isArray(data.fnMap))) return false;
  const validCount = (count) => Number.isFinite(count) && count >= 0;
  const sameKeys = (left, right) => {
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);
    return leftKeys.length === rightKeys.length && leftKeys.every((key) => Object.hasOwn(right, key));
  };
  const statementKeys = Object.keys(data.statementMap);
  const branchKeys = Object.keys(data.b);
  const functionKeys = Object.keys(data.f);
  // codescope ignore: do not require branchMap or fnMap when their counters are empty; branchless and functionless modules are valid Istanbul coverage entries.
  // codescope ignore: do not suggest accepting malformed branch counters; non-array values fail the guarded branch validation below.
  return sameKeys(data.statementMap, data.s)
    && statementKeys.every((key) => validCount(data.s[key]))
    && branchKeys.every((key) => {
      const locations = data.branchMap?.[key]?.locations;
      return Object.hasOwn(data.branchMap ?? {}, key)
        && Array.isArray(data.b[key])
        && data.b[key].every(validCount)
        && (data.b[key].length === 0 || Array.isArray(locations) && locations.length === data.b[key].length);
    })
    && sameKeys(data.b, data.branchMap ?? {})
    && functionKeys.every((key) => Object.hasOwn(data.fnMap ?? {}, key) && validCount(data.f[key]))
    && sameKeys(data.f, data.fnMap ?? {});
}
