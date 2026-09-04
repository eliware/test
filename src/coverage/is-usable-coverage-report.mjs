/** Determine whether a JSON coverage object contains instrumented entries. */
export function isUsableCoverageReport(json) {
  const entries = json && typeof json === 'object' && !Array.isArray(json) ? Object.values(json) : [];
  return entries.length > 0 && entries.every((data) => {
    if (!data || typeof data !== 'object' || !data.statementMap || !data.s || typeof data.s !== 'object' || !data.b || typeof data.b !== 'object' || !data.f || typeof data.f !== 'object') return false;
    return Object.keys(data.statementMap).length > 0 && Object.keys(data.statementMap).every((key) => Object.hasOwn(data.s, key));
  });
}
