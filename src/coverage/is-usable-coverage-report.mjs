/** Determine whether a JSON coverage object contains instrumented entries. */
export function isUsableCoverageReport(json) {
  const entries = json && typeof json === 'object' && !Array.isArray(json) ? Object.values(json) : [];
  return entries.length > 0 && entries.every((data) => {
    if (!data || typeof data !== 'object' || !data.statementMap || !data.s || typeof data.s !== 'object' || !data.b || typeof data.b !== 'object' || !data.f || typeof data.f !== 'object') return false;
    const validCount = (count) => Number.isFinite(count) && count >= 0;
    const statements = Object.keys(data.statementMap);
    const branches = Object.keys(data.b);
    const functions = Object.keys(data.f);
    return statements.length > 0
      && statements.every((key) => Object.hasOwn(data.s, key) && validCount(data.s[key]))
      && branches.every((key) => Object.hasOwn(data.branchMap ?? {}, key) && Array.isArray(data.b[key]) && data.b[key].every(validCount))
      && functions.every((key) => Object.hasOwn(data.fnMap ?? {}, key) && validCount(data.f[key]));
  });
}
