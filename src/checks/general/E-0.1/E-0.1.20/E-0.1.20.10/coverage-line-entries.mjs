export function coverageLineEntries(data, sourceStatementMap = data.statementMap) {
  const explicit = Object.entries(data.l ?? {});
  const lines = new Map();
  for (const [id, entry] of Object.entries(sourceStatementMap ?? {})) {
    const line = entry?.start?.line;
    if (line) {
      const count = Number(data.s?.[id] ?? 0);
      const key = String(line);
      lines.set(key, lines.has(key) ? Math.min(lines.get(key), count) : count);
    }
  }
  if (sourceStatementMap !== undefined && lines.size > 0) {
    const derived = [...lines.entries()];
    if (Object.hasOwn(data, "l")) {
      const explicitByLine = new Map(explicit);
      if (
        explicitByLine.size !== lines.size ||
        [...lines].some(([line, count]) => explicitByLine.get(line) !== count)
      ) {
        throw new Error("Coverage line counters do not match source-derived line coverage.");
      }
    }
    return derived;
  }
  if (explicit.length > 0) return explicit;
  return [...lines.entries()];
}
