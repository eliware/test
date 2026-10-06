import { readFile } from "node:fs/promises";
import { relative, join } from "node:path";

function lineOf(location) {
  return location?.start?.line ?? location?.line;
}

function statementGaps(statementMap, counts) {
  return Object.entries(statementMap ?? {})
    .filter(([id]) => counts?.[id] === 0)
    .map(([id, location]) => `statement ${id} at line ${lineOf(location) ?? "unknown"}`);
}

function uncoveredLines(statementMap, counts) {
  const lines = new Map();
  for (const [id, location] of Object.entries(statementMap ?? {})) {
    const line = lineOf(location);
    if (Number.isInteger(line)) lines.set(line, Math.max(lines.get(line) ?? 0, counts?.[id] ?? 0));
  }
  return [...lines].filter(([, count]) => count === 0).map(([line]) => line);
}

function branchGaps(branchMap, counts) {
  return Object.entries(branchMap ?? {}).flatMap(([id, branch]) =>
    (counts?.[id] ?? []).flatMap((count, path) =>
      count === 0
        ? [
            `line ${lineOf(branch.locations?.[path]) ?? branch.line}, ${branch.type} path ${path + 1}`,
          ]
        : [],
    ),
  );
}

function functionGaps(functionMap, counts) {
  return Object.entries(functionMap ?? {})
    .filter(([id]) => counts?.[id] === 0)
    .map(([, fn]) => `${fn.name || "anonymous"} at line ${lineOf(fn.loc) ?? fn.line}`);
}

function formatFile(file, data, root) {
  const displayPath = root ? relative(root, file).replaceAll("\\", "/") || file : file;
  const statements = statementGaps(data.statementMap, data.s);
  const lines = uncoveredLines(data.statementMap, data.s);
  const branches = branchGaps(data.branchMap, data.b);
  const functions = functionGaps(data.fnMap, data.f);
  return [
    `${displayPath}:`,
    ...(statements.length ? [`  statements uncovered at: ${statements.join(", ")}`] : []),
    ...(lines.length ? [`  lines uncovered at: ${lines.sort((a, b) => a - b).join(", ")}`] : []),
    ...(branches.length ? [`  branches uncovered at: ${branches.join("; ")}`] : []),
    ...(functions.length ? [`  functions uncovered at: ${functions.join("; ")}`] : []),
  ];
}

export async function formatJestCoverageFailure(result, root, read = readFile) {
  if (!result?.coverageDirectory)
    return "Coverage details unavailable: Jest did not retain its coverage directory.";
  let coverage;
  try {
    coverage = JSON.parse(
      await read(join(result.coverageDirectory, "coverage-final.json"), "utf8"),
    );
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return `Coverage details unavailable: could not read coverage-final.json (${detail}).`;
  }
  const files = Object.entries(coverage ?? {}).flatMap(([file, data]) => {
    const detail = formatFile(file, data ?? {}, root);
    return detail.length > 1 ? detail : [];
  });
  return files.length
    ? `Coverage gaps:\n${files.join("\n")}`
    : "Coverage details contain no uncovered entries.";
}
