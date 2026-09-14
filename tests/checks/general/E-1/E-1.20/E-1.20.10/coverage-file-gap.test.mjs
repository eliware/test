import { expect, test } from "@jest/globals";
import { fileGap } from "../../../../../../src/checks/general/E-1/E-1.20/E-1.20.10/coverage-file-gap.mjs";

test("returns no gap for fully covered files and diagnostics for uncovered files", () => {
  const complete = { s: { 1: 1 }, b: { 1: [1] }, f: { 1: 1 }, l: { 1: 1 }, statementMap: { 1: {} } };
  expect(fileGap("complete.mjs", complete)).toBeNull();
  expect(fileGap("gap.mjs", { ...complete, s: { 1: 0 } })).toEqual(expect.objectContaining({ file: "gap.mjs" }));
});

test("reports statement, branch, function, and line locations", () => {
  const gap = fileGap("gap.mjs", {
    s: { 1: 0, 2: 1 },
    statementMap: { 1: { start: { line: 4, column: 2 } } },
    b: { 1: [0, 1], 2: [0], 3: [0] },
    branchMap: {
      1: { locations: [{ start: { line: 6 } }, {}] },
      2: { start: { line: 7 } },
    },
    f: { 1: 0, 2: 1, 3: 0 },
    fnMap: { 1: { name: "missing", start: { line: 8 } } },
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
    s: { 1: 1 }, b: { 1: [1] }, f: { 1: 1 }, l: { 1: 1, 2: 0 }, statementMap: { 1: {} },
  })).toMatchObject({ lines: ["2"] });
  expect(fileGap("empty.mjs", {})).toBeNull();
  expect(fileGap("map-only.mjs", { statementMap: { 1: {} } })).toBeNull();
});
