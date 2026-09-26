export function coverageLineEntries(data, sourceStatementMap = data.statementMap) {
  const lines = new Map();
  const counters = data.s ?? {};
  for (const [id, entry] of Object.entries(sourceStatementMap ?? {})) {
    if (!Object.hasOwn(counters, id)) {
      throw new Error(`Coverage evidence is incomplete: statement counter ${id} is missing.`);
    }
    const line = entry?.start?.line;
    if (line) {
      const count = Number(counters[id]);
      const key = String(line);
      const previous = lines.get(key);
      if (previous === undefined || count > previous) lines.set(key, count);
    }
  }
  if (sourceStatementMap !== undefined && lines.size > 0) {
    const derived = [...lines.entries()];
    if (Object.hasOwn(data, "l")) {
      const explicitByLine = new Map(Object.entries(data.l));
      if (
        explicitByLine.size !== lines.size ||
        [...lines].some(([line, count]) => explicitByLine.get(line) !== count)
      ) {
        throw new Error("Coverage line counters do not match source-derived line coverage.");
      }
    }
    return derived;
  }
  const explicit = Object.entries(data.l ?? {});
  if (explicit.length > 0) return explicit;
  return [...lines.entries()];
}
