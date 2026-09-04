import { isCoveredCount } from './percentages.mjs';

export function collectLineCoverage(data) {
  const lineCounts = new Map();
  let unmappedLineCount = 0;
  if (data.l && typeof data.l === 'object' && !Array.isArray(data.l)) {
    for (const [line, count] of Object.entries(data.l)) {
      const lineNumber = Number(line);
      if (Number.isInteger(lineNumber) && lineNumber > 0 && Number.isFinite(count)) lineCounts.set(lineNumber, isCoveredCount(count) ? 1 : 0);
    }
  }
  let hasUnmappedStatement = false;
  Object.entries(data.statementMap).forEach(([id, statement]) => {
    const statementCounts = data.s && (typeof data.s === 'object' || typeof data.s === 'function') ? data.s : {};
    const count = statementCounts[id];
    const statementStart = statement && typeof statement === 'object' && Object.hasOwn(statement, 'start') && statement.start && typeof statement.start === 'object' && !Array.isArray(statement.start) ? statement.start : undefined;
    const line = statementStart?.line;
    if (typeof line === 'number' && Number.isFinite(line) && !data.l) lineCounts.set(line, Math.min(lineCounts.get(line) ?? 1, isCoveredCount(count) ? 1 : 0));
    if (data.l) { if (!Number.isFinite(count)) hasUnmappedStatement = true; } else { unmappedLineCount += 1; if (!isCoveredCount(count)) hasUnmappedStatement = true; }
  });
  Object.entries(data.s ?? {}).forEach(([id, count]) => { if (!(id in data.statementMap) && !isCoveredCount(count)) hasUnmappedStatement = true; });
  return { lineCounts, unmappedLineCount, hasUnmappedStatement };
}
