import { expect, test } from "@jest/globals";
import { parseDetailed } from "../../../../../../src/checks/general/E-0.1/E-0.1.20/E-0.1.20.10/parse-detailed-coverage.mjs";
import { expectedCoverageShape } from "../../../../../../src/checks/general/E-0.1/E-0.1.20/E-0.1.20.10/coverage-source-shapes.mjs";

test("rejects missing evidence for an expected source with no instrumentable statements", () => {
  const file = "src/empty.mjs";
  const shape = expectedCoverageShape("// no instrumentable statements", file);
  expect(Object.keys(shape.statementMap)).toHaveLength(0);
  expect(() => parseDetailed({}, [file], { [file]: shape })).toThrow(
    "Detailed coverage omits in-scope source file(s): src/empty.mjs.",
  );
});

test("aggregates coverage gaps and metric totals across detailed source files", () => {
  const gapLocation = { start: { line: 4, column: 1 }, end: { line: 4, column: 2 } };
  const completeLocation = { start: { line: 1, column: 1 }, end: { line: 1, column: 2 } };
  const report = {
    "src/gap.mjs": {
      statementMap: { 0: { start: { line: 4 } } },
      s: { 0: 0 },
      branchMap: { 0: { type: "if", line: 4, locations: [gapLocation] } },
      b: { 0: [0] },
      fnMap: { 0: {} },
      f: { 0: 0 },
      l: { 4: 0 },
    },
    "src/complete.mjs": {
      s: { 0: 1 },
      b: { 0: [1, 1] },
      f: { 0: 1 },
      l: { 1: 1 },
      statementMap: { 0: { start: { line: 1 } } },
      branchMap: { 0: { type: "if", line: 1, locations: [completeLocation, completeLocation] } },
      fnMap: { 0: {} },
    },
  };
  const expectedFiles = Object.keys(report);
  const expectedShapes = Object.fromEntries(
    Object.entries(report).map(([file, data]) => [
      file,
      {
        statementMap: data.statementMap,
        branchMap: data.branchMap,
        fnMap: data.fnMap,
        lineMap: Object.fromEntries(
          [...new Set(Object.values(data.statementMap).map(({ start }) => String(start.line)))].map(
            (line) => [line, {}],
          ),
        ),
      },
    ]),
  );
  const result = parseDetailed(report, expectedFiles, expectedShapes);
  expect(result.gaps).toHaveLength(1);
  expect(result.totals).toMatchObject({ statements: 50, functions: 50, lines: 50 });
  expect(result.totals.branches).toBeCloseTo(200 / 3);
});

test("rejects detailed source reports without an independent repository inventory", () => {
  const complete = { s: {}, b: {}, f: {}, statementMap: {}, branchMap: {}, fnMap: {} };
  expect(() => parseDetailed({ "src/unlisted.mjs": complete })).toThrow(
    "Detailed coverage contains non-repository source file",
  );
});

test("returns null when a detailed report has no in-scope source files", () => {
  expect(parseDetailed(null)).toBeNull();
  expect(parseDetailed({ "README.md": {}, "tests/example.test.mjs": {} })).toBeNull();
});

test("aggregates against source shapes after Windows path normalization", () => {
  const shape = {
    statementMap: { 0: { start: { line: 1 } } },
    branchMap: {},
    fnMap: {},
    lineMap: { 1: {} },
  };
  const evidence = {
    s: { 0: 1 },
    b: {},
    f: {},
    l: { 1: 1 },
    statementMap: shape.statementMap,
    branchMap: {},
    fnMap: {},
  };
  expect(
    parseDetailed({ "C:\\repo\\src\\listed.mjs": evidence }, ["src/listed.mjs"], {
      "src/listed.mjs": shape,
    }).totals.lines,
  ).toBe(100);
});
