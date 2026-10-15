export function redactMatchedSecrets(text, matchEnds, limit = text.length) {
  let output = "";
  let cursor = 0;
  let rangeStart = -1;
  let rangeEnd = -1;
  for (let start = 0; start < limit; start += 1) {
    const end = matchEnds[start] ?? 0;
    if (end <= start || end > limit) continue;
    if (rangeStart < 0) {
      output += text.slice(cursor, start);
      rangeStart = start;
      rangeEnd = end;
    } else if (start <= rangeEnd) {
      rangeEnd = Math.max(rangeEnd, end);
    } else {
      output += `[REDACTED]${text.slice(rangeEnd, start)}`;
      rangeStart = start;
      rangeEnd = end;
    }
    cursor = rangeEnd;
  }
  if (rangeStart < 0) return text.slice(0, limit);
  return `${output}[REDACTED]${text.slice(cursor, limit)}`;
}
