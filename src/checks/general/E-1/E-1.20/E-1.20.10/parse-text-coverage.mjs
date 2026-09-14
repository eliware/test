const metrics = ["statements", "branches", "functions", "lines"];

function parseRow(line) {
  const columns = line.split("|").map((value) => value.trim());
  if (columns.length < 5 || !columns[0] || /^[-\s]+$/u.test(columns[0])) return null;
  const values = columns.slice(1, 5).map((value) => Number.parseFloat(value));
  if (values.some((value) => !Number.isFinite(value))) return null;
  return { file: columns[0], values };
}

export function parseText(text) {
  const rows = text.split(/\r?\n/).map(parseRow).filter(Boolean);
  const aggregate = rows.find(({ file }) => /^All files$/iu.test(file));
  const fileRows = rows.filter(({ file }) => !/^All files$/iu.test(file));
  if (!aggregate || fileRows.length === 0) return null;

  return {
    gaps: fileRows
      .filter(({ values }) => values.some((value) => value !== 100))
      .map(({ file, values }) => ({
        file,
        metrics: Object.fromEntries(metrics.map((metric, index) => [metric, values[index]])),
        lines: [],
        statements: [],
        branches: [],
        functions: [],
      })),
    totals: Object.fromEntries(metrics.map((metric, index) => [metric, aggregate.values[index]])),
  };
}
