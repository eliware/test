import { coverageLineEntries } from "./coverage-line-entries.mjs";

function requireMatchingSourceEntries(file, actual, expected, metric) {
  const actualKeys = Object.keys(actual ?? {}).sort();
  const expectedKeys = Object.keys(expected ?? {}).sort();
  if (
    actualKeys.length !== expectedKeys.length ||
    actualKeys.some((key, index) => key !== expectedKeys[index])
  ) {
    throw new Error(
      `Coverage report does not account for every source ${metric} entry in ${file}.`,
    );
  }
}

function sameBranchLocation(actual, expected) {
  const samePoint = (actualPoint, expectedPoint) => {
    return (
      actualPoint !== null &&
      actualPoint !== undefined &&
      expectedPoint !== null &&
      expectedPoint !== undefined &&
      actualPoint.line === expectedPoint.line &&
      actualPoint.column === expectedPoint.column
    );
  };
  return ["start", "end"].every((edge) => samePoint(actual?.[edge], expected?.[edge]));
}

export function validateCoverageSourceShape(file, data, expectedShape) {
  for (const [map, counters, metric] of [
    ["statementMap", "s", "statement"],
    ["branchMap", "b", "branch"],
    ["fnMap", "f", "function"],
  ]) {
    requireMatchingSourceEntries(file, data[map], expectedShape[map], metric);
    requireMatchingSourceEntries(file, data[counters], expectedShape[map], metric);
  }
  const expectedLines = expectedShape.lineMap ?? Object.fromEntries(
    [...new Set(Object.values(expectedShape.statementMap ?? {}).map(({ start }) => String(start.line)))].map(
      (line) => [line, {}],
    ),
  );
  if (Object.hasOwn(data, "l")) {
    requireMatchingSourceEntries(file, data.l, expectedLines, "line");
  }
  coverageLineEntries(data, expectedShape.statementMap);
  for (const [id, branch] of Object.entries(expectedShape.branchMap ?? {})) {
    if (
      data.branchMap[id].type !== branch.type ||
      data.branchMap[id].line !== branch.line ||
      !Array.isArray(data.branchMap?.[id]?.locations) ||
      data.branchMap[id].locations.length !== branch.locations.length ||
      branch.locations.some(
        (location, index) => !sameBranchLocation(data.branchMap[id].locations[index], location),
      ) ||
      !Array.isArray(data.b?.[id]) ||
      data.b[id].length !== branch.locations.length
    ) {
      throw new Error(
        `Coverage report does not account for every source branch path in ${file}.`,
      );
    }
  }
}
