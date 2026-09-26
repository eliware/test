export function coverageLineEntries(data) {
  const explicit = Object.entries(data.l ?? {});
  if (explicit.length > 0) return explicit;
  const lines = new Map();
  for (const [id, entry] of Object.entries(data.statementMap ?? {})) {
    const line = entry?.start?.line;
    if (line) {
      const count = Number(data.s?.[id] ?? 0);
      lines.set(String(line), lines.has(String(line)) ? Math.min(lines.get(String(line)), count) : count);
    }
  }
  return [...lines.entries()];
}
