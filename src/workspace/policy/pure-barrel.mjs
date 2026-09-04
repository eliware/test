/** Return whether source contains only import/export barrel statements. */
export function isPureBarrelSource(source) {
  const withoutComments = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*(?=\r?$)/gm, '$1').trim();
  if (!withoutComments) return false;
  return withoutComments.split(';').map((statement) => statement.trim()).filter(Boolean).every((statement) => /^(?:import\b|export\s+(?:(?:type\s+)?(?:\{|\*)))[\s\S]*$/u.test(statement));
}
