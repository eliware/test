const metrics = ["statements", "branches", "functions", "lines"];

function percentage(covered, total) {
  return total > 0 ? (covered / total) * 100 : 100;
}

function location(entry) {
  return entry?.start?.line
    ? `${entry.start.line}${entry.start.column ? `:${entry.start.column}` : ""}`
    : "unknown";
}

export function fileGap(file, data) {
  const statements = Object.entries(data.s ?? {}).filter(([, count]) => count === 0)
    .map(([id]) => ({ location: location(data.statementMap?.[id]) }));
  const branches = Object.entries(data.b ?? {}).flatMap(([id, counts]) => counts.map((count, index) =>
    count === 0 ? { location: location(data.branchMap?.[id]?.locations?.[index] ?? data.branchMap?.[id]) } : null,
  ).filter(Boolean));
  const functions = Object.entries(data.f ?? {}).filter(([, count]) => count === 0)
    .map(([id]) => ({ name: data.fnMap?.[id]?.name ?? "anonymous", location: location(data.fnMap?.[id]) }));
  const lineEntries = Object.entries(data.l ?? {});
  const lines = (lineEntries.length > 0
    ? lineEntries.filter(([, count]) => count === 0).map(([line]) => line)
    : statements.map(({ location: line }) => line.split(":")[0])).filter((line) => line !== "unknown");
  const lineCovered = lineEntries.length > 0
    ? lineEntries.filter(([, count]) => count > 0).length
    : Object.keys(data.s ?? {}).length - statements.length;
  const lineTotal = lineEntries.length > 0 ? lineEntries.length : Object.keys(data.s ?? {}).length;
  const values = {
    statements: percentage(Object.values(data.s ?? {}).filter((count) => count > 0).length, Object.keys(data.s ?? {}).length),
    branches: percentage(Object.values(data.b ?? {}).flat().filter((count) => count > 0).length, Object.values(data.b ?? {}).flat().length),
    functions: percentage(Object.values(data.f ?? {}).filter((count) => count > 0).length, Object.keys(data.f ?? {}).length),
    lines: percentage(lineCovered, lineTotal),
  };
  if (Object.keys(data.statementMap ?? {}).length === 0 && Object.keys(data.s ?? {}).length === 0) return null;
  return metrics.every((metric) => values[metric] === 100)
    ? null
    : { file, metrics: values, lines, statements, branches, functions };
}
