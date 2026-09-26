import { expect, test } from "@jest/globals";
import { validateCoverageFileEvidence } from "../../../../../../src/checks/general/E-0.1/E-0.1.20/E-0.1.20.10/validate-coverage-file-evidence.mjs";
import { expectedCoverageShape } from "../../../../../../src/checks/general/E-0.1/E-0.1.20/E-0.1.20.10/coverage-source-shapes.mjs";

function completeEvidence(shape) {
  const lines = [
    ...new Set(Object.values(shape.statementMap).map(({ start }) => String(start.line))),
  ];
  return {
    statementMap: structuredClone(shape.statementMap),
    s: Object.fromEntries(Object.keys(shape.statementMap).map((id) => [id, 1])),
    branchMap: structuredClone(shape.branchMap),
    b: Object.fromEntries(
      Object.entries(shape.branchMap).map(([id, branch]) => [id, branch.locations.map(() => 1)]),
    ),
    fnMap: structuredClone(shape.fnMap),
    f: Object.fromEntries(Object.keys(shape.fnMap).map((id) => [id, 1])),
    l: Object.fromEntries(lines.map((line) => [line, 1])),
  };
}

test("accepts empty or complete matching evidence", () => {
  expect(validateCoverageFileEvidence("empty.mjs", {})).toBeUndefined();
  expect(
    validateCoverageFileEvidence("complete.mjs", {
      statementMap: { 1: {} },
      s: { 1: 1 },
      branchMap: { 1: {} },
      b: { 1: [] },
      fnMap: { 1: {} },
      f: { 1: 1 },
      lineMap: { 1: {} },
      l: { 1: 1 },
    }),
  ).toBeUndefined();
});

test("rejects one-sided evidence, absent required pairs, and missing counters", () => {
  expect(() => validateCoverageFileEvidence("map-only.mjs", { statementMap: { 1: {} } })).toThrow(
    "incomplete",
  );
  expect(() => validateCoverageFileEvidence("counter-only.mjs", { s: { 1: 1 } })).toThrow(
    "incomplete",
  );
  expect(() => validateCoverageFileEvidence("missing-map.mjs", { s: {} })).toThrow("incomplete");
  expect(() => validateCoverageFileEvidence("missing-counter.mjs", { statementMap: {} })).toThrow(
    "incomplete",
  );
  expect(() =>
    validateCoverageFileEvidence("empty-counter-map.mjs", { statementMap: { 1: {} }, s: {} }),
  ).toThrow("incomplete");
});

test("rejects mismatched map keys and malformed counters", () => {
  expect(() =>
    validateCoverageFileEvidence("key-count.mjs", { statementMap: { 1: {}, 2: {} }, s: { 1: 1 } }),
  ).toThrow("keys do not match");
  expect(() =>
    validateCoverageFileEvidence("key-identity.mjs", { statementMap: { 1: {} }, s: { 2: 1 } }),
  ).toThrow("keys do not match");
  expect(() =>
    validateCoverageFileEvidence("invalid.mjs", { statementMap: { 1: {} }, s: { 1: Number.NaN } }),
  ).toThrow("malformed");
});

test("requires counters for each reported metric map", () => {
  expect(() =>
    validateCoverageFileEvidence("missing-lines.mjs", { lineMap: { 1: {} }, l: {} }),
  ).toThrow("incomplete");
  expect(() =>
    validateCoverageFileEvidence("missing-branches.mjs", {
      s: { 1: 1 },
      statementMap: { 1: {} },
      branchMap: { 1: {} },
      b: {},
    }),
  ).toThrow("incomplete");
  expect(() =>
    validateCoverageFileEvidence("missing-branch-field.mjs", {
      s: { 1: 1 },
      statementMap: { 1: {} },
      branchMap: { 1: {} },
    }),
  ).toThrow("incomplete");
  expect(() =>
    validateCoverageFileEvidence("missing-functions.mjs", {
      s: { 1: 1 },
      statementMap: { 1: {} },
      fnMap: { 1: {} },
      f: {},
    }),
  ).toThrow("incomplete");
});

test("requires matching statement and branch maps and counters", () => {
  expect(() =>
    validateCoverageFileEvidence("mismatch.mjs", { s: { 1: 1, 2: 1 }, statementMap: { 1: {} } }),
  ).toThrow("map and counter keys do not match");
  expect(() =>
    validateCoverageFileEvidence("mismatch-branch.mjs", {
      s: { 1: 1 },
      statementMap: { 1: {} },
      b: { 1: [1], 2: [1] },
      branchMap: { 1: { locations: [{}] } },
    }),
  ).toThrow("map and counter keys do not match");
});

test("requires evidence entries for every statement, branch, and branch path in source", () => {
  const shape = expectedCoverageShape(
    "export function decide(value) { if (value) return 1; return 0; }",
    "src/decision.mjs",
  );
  const missingStatement = completeEvidence(shape);
  const statementId = Object.keys(shape.statementMap).at(-1);
  delete missingStatement.statementMap[statementId];
  delete missingStatement.s[statementId];
  expect(() => validateCoverageFileEvidence("src/decision.mjs", missingStatement, shape)).toThrow(
    "every source statement entry",
  );

  const branchId = Object.keys(shape.branchMap)[0];
  const missingBranch = completeEvidence(shape);
  delete missingBranch.branchMap[branchId];
  delete missingBranch.b[branchId];
  expect(() => validateCoverageFileEvidence("src/decision.mjs", missingBranch, shape)).toThrow(
    "every source branch entry",
  );

  const missingBranchPath = completeEvidence(shape);
  missingBranchPath.b[branchId].pop();
  expect(() => validateCoverageFileEvidence("src/decision.mjs", missingBranchPath, shape)).toThrow(
    "every source branch path",
  );

  const alteredBranchLocation = completeEvidence(shape);
  alteredBranchLocation.branchMap[branchId].locations[0].start.line += 1;
  expect(() =>
    validateCoverageFileEvidence("src/decision.mjs", alteredBranchLocation, shape),
  ).toThrow("every source branch path");
});

test("accepts source-shaped evidence and empty expected source maps", () => {
  const shape = expectedCoverageShape(
    "export function decide(value) { if (value) return 1; return 0; }",
    "src/decision.mjs",
  );
  expect(
    validateCoverageFileEvidence("src/decision.mjs", completeEvidence(shape), shape),
  ).toBeUndefined();
  const shapeWithoutLineMap = { ...shape, lineMap: undefined };
  expect(
    validateCoverageFileEvidence(
      "src/decision.mjs",
      completeEvidence(shape),
      shapeWithoutLineMap,
    ),
  ).toBeUndefined();
  expect(
    validateCoverageFileEvidence(
      "empty.mjs",
      {},
      { statementMap: undefined, branchMap: undefined, fnMap: undefined },
    ),
  ).toBeUndefined();
});

test("rejects omitted or altered line counters against source-derived lines", () => {
  const shape = expectedCoverageShape(
    "export function decide(value) { if (value) return 1; return 0; }",
    "src/decision.mjs",
  );
  const omittedLine = completeEvidence(shape);
  delete omittedLine.l[Object.keys(omittedLine.l)[0]];
  expect(() => validateCoverageFileEvidence("src/decision.mjs", omittedLine, shape)).toThrow(
    "every source line entry",
  );

  const alteredLine = completeEvidence(shape);
  alteredLine.l[Object.keys(alteredLine.l)[0]] = 0;
  expect(() => validateCoverageFileEvidence("src/decision.mjs", alteredLine, shape)).toThrow(
    "source-derived line coverage",
  );
});
