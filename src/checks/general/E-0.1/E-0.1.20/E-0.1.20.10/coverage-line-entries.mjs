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
      // Istanbul line coverage marks a line hit when any statement on that line executes.
      if (previous === undefined || count > previous) lines.set(key, count);
    }
  }
  if (sourceStatementMap !== undefined && lines.size > 0) {
    if (Object.hasOwn(data, "l")) {
      const explicitByLine = new Map(Object.entries(data.l));
      let mismatch = explicitByLine.size !== lines.size;
      for (const [line, count] of lines) {
        if (explicitByLine.get(line) !== count) mismatch = true;
      }
      if (mismatch) {
        throw new Error("Coverage line counters do not match source-derived line coverage.");
      }
    }
    return lines;
  }
  const explicit = new Map(Object.entries(data.l ?? {}));
  if (explicit.size > 0) return explicit;
  return lines;
}
