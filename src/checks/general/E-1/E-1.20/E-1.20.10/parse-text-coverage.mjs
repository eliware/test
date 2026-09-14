const metrics = ["statements", "branches", "functions", "lines"];

export function parseText(text) {
  const row = text.split(/\r?\n/).find((line) => /^\s*All files\s*\|/iu.test(line));
  if (!row) return null;
  const values = row.split("|").slice(1, 5).map((value) => Number.parseFloat(value));
  if (values.length !== 4 || values.some((value) => !Number.isFinite(value))) return null;
  return { gaps: [], totals: Object.fromEntries(metrics.map((metric, index) => [metric, values[index]])) };
}
