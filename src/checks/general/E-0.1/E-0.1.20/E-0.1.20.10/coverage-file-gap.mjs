import { coverageMetricValues } from "./coverage-metrics.mjs";
import { validateCoverageFileEvidence } from "./validate-coverage-file-evidence.mjs";
import { coverageLineEntries } from "./coverage-line-entries.mjs";

const metrics = ["statements", "branches", "functions", "lines"];

function percentage(covered, total) {
  return total > 0 ? (covered / total) * 100 : 100;
}

function location(entry) {
  const line = entry?.start?.line ?? entry?.line;
  const column = entry?.start?.column;
  return line ? `${line}${column ? `:${column}` : ""}` : "unknown";
}

export function fileGap(file, data, expectedShape = null) {
  validateCoverageFileEvidence(file, data, expectedShape);
  const statements = Object.entries(data.s ?? {})
    .filter(([, count]) => count === 0)
    .map(([id]) => ({ location: location(data.statementMap?.[id]) }));
  const branches = Object.entries(data.b ?? {}).flatMap(([id, counts]) =>
    counts
      .map((count, index) =>
        count === 0
          ? {
              id,
              path: index + 1,
              type: data.branchMap?.[id]?.type,
              location:
                location(data.branchMap?.[id]?.locations?.[index]) !== "unknown"
                  ? location(data.branchMap?.[id]?.locations?.[index])
                  : location(data.branchMap?.[id]),
            }
          : null,
      )
      .filter(Boolean),
  );
  const functions = Object.entries(data.f ?? {})
    .filter(([, count]) => count === 0)
    .map(([id]) => ({
      name: data.fnMap?.[id]?.name ?? "anonymous",
      location: location(data.fnMap?.[id]),
    }));
  const sourceStatementMap = expectedShape?.statementMap ?? data.statementMap;
  const lineEntries = coverageLineEntries(data, sourceStatementMap);
  const lines = [];
  for (const [line, count] of lineEntries) {
    if (count === 0) lines.push(line);
  }
  const { values: metricCounters, hasMaps } = coverageMetricValues(data, lineEntries);
  if (!hasMaps)
    return {
      file,
      metrics: { statements: null, branches: null, functions: null, lines: null },
      lines,
      statements,
      branches,
      functions,
    };
  const values = Object.fromEntries(
    metrics.map((metric) => [
      metric,
      percentage(
        metricCounters[metric].filter((count) => count > 0).length,
        metricCounters[metric].length,
      ),
    ]),
  );
  return metrics.every((metric) => values[metric] === 100)
    ? null
    : { file, metrics: values, lines, statements, branches, functions };
}
