import { expect, test } from "@jest/globals";
import { fileGap } from "../../../../../../src/checks/general/E-0.1/E-0.1.20/E-0.1.20.10/coverage-file-gap.mjs";
test("returns no gap for fully covered files and diagnostics for uncovered files", () => {
  const complete = {
    s: { 1: 1 },
    b: { 1: [1] },
    f: { 1: 1 },
    l: { 1: 1 },
    statementMap: { 1: {} },
    branchMap: { 1: { locations: [{}] } },
    fnMap: { 1: {} },
  };
  expect(fileGap("complete.mjs", complete)).toBeNull();
  expect(fileGap("gap.mjs", { ...complete, s: { 1: 0 } })).toEqual(
    expect.objectContaining({ file: "gap.mjs" }),
  );
});

test("counts positive Istanbul counters as covered entries, independent of execution frequency", () => {
  const singleExecution = {
    s: { 1: 1, 2: 0 },
    b: {},
    f: {},
    l: { 1: 1, 2: 0 },
    statementMap: { 1: {}, 2: {} },
    branchMap: {},
    fnMap: {},
    lineMap: { 1: {}, 2: {} },
  };
  const repeatedExecution = {
    ...singleExecution,
    s: { 1: 100, 2: 0 },
    l: { 1: 100, 2: 0 },
  };

  expect(fileGap("single.mjs", singleExecution)?.metrics.statements).toBe(50);
  expect(fileGap("repeated.mjs", repeatedExecution)?.metrics.statements).toBe(50);
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
    functions: [
      { name: "missing", location: "8" },
      { name: "anonymous", location: "unknown" },
    ],
  });
  expect(gap.branches).toEqual(
    expect.arrayContaining([{ location: "6" }, { location: "unknown" }, { location: "7" }]),
  );
  expect(gap.metrics.branches).toBeLessThan(100);
  expect(gap.metrics.branches).toBe(25);
});

test("derives line coverage as covered when any statement on that line is covered", () => {
  const gap = fileGap("shared-line.mjs", {
    statementMap: {
      1: { start: { line: 3 } },
      2: { start: { line: 3 } },
    },
    s: { 1: 1, 2: 0 },
    branchMap: {},
    b: {},
    fnMap: {},
    f: {},
    l: { 3: 1 },
  });

  expect(gap.metrics).toMatchObject({ statements: 50, lines: 100 });
  expect(gap.statements).toEqual([{ location: "3" }]);
});

test("reports excess branch counters without mapped locations", () => {
  const gap = fileGap("branch-map-gap.mjs", {
    s: { 1: 1 },
    statementMap: { 1: { start: { line: 1 } } },
    b: { 1: [1, 0] },
    branchMap: { 1: { locations: [{}] } },
    f: { 1: 1 },
    fnMap: { 1: {} },
    l: { 1: 1 },
  });
  expect(gap?.branches).toContainEqual({ location: "unknown" });
  expect(gap?.metrics.branches).toBe(50);
});

test("uses explicit line data and handles empty or incomplete coverage maps", () => {
  expect(
    fileGap("lines.mjs", {
      s: { 1: 1 },
      b: { 1: [1] },
      f: { 1: 1 },
      l: { 1: 1, 2: 0 },
      statementMap: { 1: {} },
      branchMap: { 1: { locations: [{}] } },
      fnMap: { 1: {} },
    }),
  ).toMatchObject({ lines: ["2"] });
  expect(fileGap("empty.mjs", {})).toMatchObject({
    file: "empty.mjs",
    metrics: { statements: null, branches: null, functions: null, lines: null },
  });
  expect(() => fileGap("map-only.mjs", { statementMap: { 1: {} } })).toThrow(
    "Coverage evidence is incomplete",
  );
  expect(() => fileGap("counter-only.mjs", { s: { 0: 1 } })).toThrow(
    "Coverage evidence is incomplete",
  );
});

test("does not report gaps for source modules with no instrumentable counters", () => {
  const emptyShape = { statementMap: {}, branchMap: {}, fnMap: {}, lineMap: {} };
  const emptyEvidence = {
    s: {},
    b: {},
    f: {},
    l: {},
    statementMap: {},
    branchMap: {},
    fnMap: {},
    lineMap: {},
  };

  expect(fileGap("comment-only.mjs", emptyEvidence, emptyShape)).toBeNull();
});

test("rejects evidence that omits source statement entries", () => {
  const expectedShape = {
    statementMap: {
      1: { start: { line: 1 } },
      2: { start: { line: 8 } },
    },
    branchMap: {},
    fnMap: {},
  };
  const incompleteEvidence = {
    statementMap: { 1: { start: { line: 1 } } },
    s: { 1: 1 },
  };

  expect(() => fileGap("incomplete.mjs", incompleteEvidence, expectedShape)).toThrow(
    "Coverage report does not account for every source statement entry",
  );
});

test("rejects source branches with no branch paths", () => {
  const branch = { type: "switch", line: 4, locations: [] };
  const data = {
    s: {},
    b: { 1: [] },
    f: {},
    l: {},
    statementMap: {},
    branchMap: { 1: branch },
    fnMap: {},
  };
  expect(() =>
    fileGap("empty-branch.mjs", data, {
      statementMap: {},
      branchMap: { 1: branch },
      fnMap: {},
    }),
  ).toThrow("source branch must contain at least one path");
});
