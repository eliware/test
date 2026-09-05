import { isCoveredCount } from './percentages.mjs';

export function collectLineCoverage(data) {
  const lineCounts = new Map();
  let unmappedLineCount = 0;
  const hasLineMap = data.l && typeof data.l === 'object' && !Array.isArray(data.l);
  if (hasLineMap) {
    for (const [line, count] of Object.entries(data.l)) {
      const lineNumber = Number(line);
      if (Number.isInteger(lineNumber) && lineNumber > 0 && Number.isFinite(count)) lineCounts.set(lineNumber, isCoveredCount(count) ? 1 : 0);
    }
  }
  let hasUnmappedStatement = false;
  const statementIds = new Set([...Object.keys(data.statementMap), ...Object.keys(data.s ?? {})]);
  statementIds.forEach((id) => {
    const statement = data.statementMap[id];
    const hasStatement = Object.hasOwn(data.statementMap, id);
    const statementCounts = data.s && (typeof data.s === 'object' || typeof data.s === 'function') ? data.s : {};
    const count = statementCounts[id];
    const statementStart = statement && typeof statement === 'object' && Object.hasOwn(statement, 'start') && statement.start && typeof statement.start === 'object' && !Array.isArray(statement.start) ? statement.start : undefined;
    const line = statementStart?.line;
    const validLine = Number.isInteger(line) && line > 0;
    if (!hasStatement) { hasUnmappedStatement = true; return; }
    if (validLine && !hasLineMap) lineCounts.set(line, Math.min(lineCounts.get(line) ?? 1, isCoveredCount(count) ? 1 : 0));
    if (hasLineMap) {
      if (!Number.isInteger(line) || line <= 0 || !Number.isFinite(count) || !isCoveredCount(count)) hasUnmappedStatement = true;
      if (validLine && !Object.hasOwn(data.l, line)) { lineCounts.set(line, 0); hasUnmappedStatement = true; }
  } else if (!validLine) { unmappedLineCount += 1; hasUnmappedStatement = true; }
  });
  return { lineCounts, unmappedLineCount, hasUnmappedStatement };
}
