import { expect, test } from "@jest/globals";
import { coverageLineEntries, fileGap } from "../../../../../../src/checks/general/E-1/E-1.20/E-1.20.10/coverage-file-gap.mjs";
import { expectedCoverageShape } from "../../../../../../src/checks/general/E-1/E-1.20/E-1.20.10/coverage-source-shapes.mjs";
import { validateCoverageFileEvidence } from "../../../../../../src/checks/general/E-1/E-1.20/E-1.20.10/validate-coverage-file-evidence.mjs";

function completeEvidence(shape) {
  const lines = [...new Set(Object.values(shape.statementMap).map(({ start }) => String(start.line)))];
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

test("derives line evidence from statement locations when Istanbul omits line counters", () => {
  expect(coverageLineEntries({ statementMap: { 0: { start: { line: 4 } } }, s: { 0: 1 } })).toEqual([["4", 1]]);
  expect(coverageLineEntries({ statementMap: { 0: { start: { line: 4 } }, 1: { start: { line: 4 } } }, s: { 0: 0, 1: 1 } })).toEqual([["4", 0]]);
  expect(coverageLineEntries({ statementMap: { 0: { start: { line: 5 } } }, s: {} })).toEqual([["5", 0]]);
  expect(coverageLineEntries({ statementMap: { 0: {} }, s: { 0: 1 } })).toEqual([]);
  expect(coverageLineEntries({ l: { 4: 1 } })).toEqual([["4", 1]]);
});

test("returns no gap for fully covered files and diagnostics for uncovered files", () => {
  const complete = { s: { 1: 1 }, b: { 1: [1] }, f: { 1: 1 }, l: { 1: 1 }, statementMap: { 1: {} }, branchMap: { 1: { locations: [{}] } }, fnMap: { 1: {} } };
  expect(fileGap("complete.mjs", complete)).toBeNull();
  expect(fileGap("gap.mjs", { ...complete, s: { 1: 0 } })).toEqual(expect.objectContaining({ file: "gap.mjs" }));
});

test("reports statement, branch, function, and line locations", () => {
  const gap = fileGap("gap.mjs", {
    s: { 1: 0, 2: 1 },
    statementMap: { 1: { start: { line: 4, column: 2 } }, 2: { start: { line: 5 } } },
    b: { 1: [0, 1], 2: [0], 3: [0] },
    branchMap: {
      1: { locations: [{ start: { line: 6 } }, {}] },
      2: { start: { line: 7 } },
      3: {},
    },
    f: { 1: 0, 2: 1, 3: 0 },
    fnMap: { 1: { name: "missing", start: { line: 8 } }, 2: {}, 3: {} },
  });
  expect(gap).toMatchObject({
    file: "gap.mjs",
    lines: ["4"],
    statements: [{ location: "4:2" }],
    functions: [{ name: "missing", location: "8" }, { name: "anonymous", location: "unknown" }],
  });
  expect(gap.branches).toEqual(expect.arrayContaining([{ location: "6" }, { location: "unknown" }, { location: "7" }]));
});

test("uses explicit line data and handles empty or incomplete coverage maps", () => {
  expect(fileGap("lines.mjs", {
    s: { 1: 1 }, b: { 1: [1] }, f: { 1: 1 }, l: { 1: 1, 2: 0 }, statementMap: { 1: {} }, branchMap: { 1: { locations: [{}] } }, fnMap: { 1: {} },
  })).toMatchObject({ lines: ["2"] });
  expect(fileGap("empty.mjs", {})).toEqual(expect.objectContaining({ file: "empty.mjs" }));
  expect(() => fileGap("map-only.mjs", { statementMap: { 1: {} } })).toThrow("Coverage evidence is incomplete");
  expect(() => fileGap("counter-only.mjs", { s: { 0: 1 } })).toThrow("Coverage evidence is incomplete");
});

test("rejects malformed coverage counters", () => {
  expect(() => fileGap("invalid.mjs", {
    s: { 1: Number.NaN }, statementMap: { 1: {} },
  })).toThrow("Coverage evidence is malformed");
});

test("rejects a nonempty line map without line counters", () => {
  expect(() => fileGap("missing-lines.mjs", {
    lineMap: { 1: { start: { line: 1 } } }, l: {},
  })).toThrow("Coverage evidence is incomplete");
});

test("rejects an individual metric map without its counters", () => {
  expect(() => fileGap("missing-branches.mjs", { s: { 1: 1 }, statementMap: { 1: {} }, branchMap: { 1: {} }, b: {} })).toThrow("Coverage evidence is incomplete");
  expect(() => fileGap("missing-branch-field.mjs", { s: { 1: 1 }, statementMap: { 1: {} }, branchMap: { 1: {} } })).toThrow("Coverage evidence is incomplete");
  expect(() => fileGap("missing-functions.mjs", { s: { 1: 1 }, statementMap: { 1: {} }, fnMap: { 1: {} }, f: {} })).toThrow("Coverage evidence is incomplete");
});

test("accepts complete line-map evidence", () => {
  expect(fileGap("complete-lines.mjs", {
    s: { 1: 1 }, statementMap: { 1: {} }, lineMap: { 1: {} }, l: { 1: 1 },
  })).toBeNull();
});

test("accepts complete branch and function maps", () => {
  expect(fileGap("complete-maps.mjs", {
    s: { 1: 1 }, statementMap: { 1: {} },
    b: { 1: [1] }, branchMap: { 1: { locations: [{}] } },
    f: { 1: 1 }, fnMap: { 1: {} }, l: { 1: 1 },
  })).toBeNull();
});

test("rejects mismatched map and counter key sets", () => {
  expect(() => fileGap("mismatch.mjs", {
    s: { 1: 1, 2: 1 }, statementMap: { 1: {} },
  })).toThrow("map and counter keys do not match");
  expect(() => fileGap("mismatch-branch.mjs", {
    s: { 1: 1 }, statementMap: { 1: {} },
    b: { 1: [1], 2: [1] }, branchMap: { 1: { locations: [{}] } },
  })).toThrow("map and counter keys do not match");
});

test("rejects source statements or branches omitted from both counters and maps", () => {
  const shape = expectedCoverageShape(
    "export function decide(value) { if (value) return 1; return 0; }",
    "src/decision.mjs",
  );
  const missingStatement = completeEvidence(shape);
  const statementId = Object.keys(shape.statementMap).at(-1);
  delete missingStatement.statementMap[statementId];
  delete missingStatement.s[statementId];
  expect(() => fileGap("src/decision.mjs", missingStatement, shape)).toThrow(
    "every source statement entry",
  );

  const missingBranch = completeEvidence(shape);
  const branchId = Object.keys(shape.branchMap)[0];
  delete missingBranch.branchMap[branchId];
  delete missingBranch.b[branchId];
  expect(() => fileGap("src/decision.mjs", missingBranch, shape)).toThrow(
    "every source branch entry",
  );

  const missingBranchPath = completeEvidence(shape);
  missingBranchPath.b[branchId].pop();
  expect(() => fileGap("src/decision.mjs", missingBranchPath, shape)).toThrow(
    "every source branch path",
  );
});

test("accepts complete source-shaped coverage and empty shape defaults", () => {
  const shape = expectedCoverageShape(
    "export function decide(value) { if (value) return 1; return 0; }",
    "src/decision.mjs",
  );
  expect(fileGap("src/decision.mjs", completeEvidence(shape), shape)).toBeNull();
  expect(
    validateCoverageFileEvidence("empty.mjs", {}, {
      statementMap: undefined,
      branchMap: undefined,
      fnMap: undefined,
    }),
  ).toBeUndefined();
});
