import { expect, test } from "@jest/globals";
import { validateCoverageSourceShape } from "../../../../../../src/checks/general/E-0.1/E-0.1.20/E-0.1.20.10/validate-coverage-source-shape.mjs";
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

test("accepts evidence matching source statements, branches, functions, and lines", () => {
  const shape = expectedCoverageShape(
    "export function decide(value) { if (value) return 1; return 0; }",
    "src/decision.mjs",
  );
  expect(() =>
    validateCoverageSourceShape("src/decision.mjs", completeEvidence(shape), shape),
  ).not.toThrow();
});

test("derives expected lines when source line maps are absent", () => {
  const shape = expectedCoverageShape(
    "export function decide(value) { if (value) return 1; return 0; }",
    "src/decision.mjs",
  );
  const withoutLineMap = { ...shape, lineMap: undefined };
  expect(() =>
    validateCoverageSourceShape("src/decision.mjs", completeEvidence(shape), withoutLineMap),
  ).not.toThrow();
  expect(() =>
    validateCoverageSourceShape("empty.mjs", {}, { statementMap: {}, branchMap: {}, fnMap: {} }),
  ).not.toThrow();
  expect(() => validateCoverageSourceShape("empty.mjs", {}, {})).not.toThrow();
});

test("rejects absent source entries and altered branch locations", () => {
  const shape = expectedCoverageShape(
    "export function decide(value) { if (value) return 1; return 0; }",
    "src/decision.mjs",
  );
  const missing = completeEvidence(shape);
  const id = Object.keys(shape.statementMap).at(-1);
  delete missing.statementMap[id];
  expect(() => validateCoverageSourceShape("src/decision.mjs", missing, shape)).toThrow(
    "every source statement entry",
  );
  const altered = completeEvidence(shape);
  altered.branchMap[Object.keys(shape.branchMap)[0]].locations[0].start.line += 1;
  expect(() => validateCoverageSourceShape("src/decision.mjs", altered, shape)).toThrow(
    "every source branch path",
  );
  const alteredType = completeEvidence(shape);
  alteredType.branchMap[Object.keys(shape.branchMap)[0]].type = "altered-branch-type";
  expect(() => validateCoverageSourceShape("src/decision.mjs", alteredType, shape)).toThrow(
    "every source branch path",
  );
  const missingLocations = completeEvidence(shape);
  delete missingLocations.branchMap[Object.keys(shape.branchMap)[0]].locations;
  expect(() => validateCoverageSourceShape("src/decision.mjs", missingLocations, shape)).toThrow(
    "every source branch path",
  );
  const missingPathCounter = completeEvidence(shape);
  missingPathCounter.b[Object.keys(shape.branchMap)[0]] = [];
  expect(() => validateCoverageSourceShape("src/decision.mjs", missingPathCounter, shape)).toThrow(
    "every source branch path",
  );
});
