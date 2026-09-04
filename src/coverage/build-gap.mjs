import { percentage, percentageWithUnknowns } from './percentages.mjs';

export function buildCoverageGap(file, statements, branches, functions, statementCounts, branchCounts, functionCounts, lineCounts, unmappedLineCount, lineGap) {
  const lines = new Set([...lineCounts].filter(([, count]) => count === 0).map(([line]) => line));
  if (!statements.length && !branches.length && !functions.length && !lines.size && !lineGap) return null;
  return { file, statements, branches, functions, lines: [...lines].sort((a, b) => a - b), metrics: {
    statements: percentage(statementCounts), branches: percentage(branchCounts), functions: percentage(functionCounts),
    lines: lineGap ? 0 : (lineCounts.size > 0 ? percentageWithUnknowns(lineCounts, unmappedLineCount) : 100)
  } };
}
