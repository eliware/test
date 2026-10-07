import { expect, test } from "@jest/globals";
import { formatJestCoverageFailure } from "../../../../../src/validation/stages/jest/progress/format-jest-coverage-failure.mjs";

const sampleCoverage = {
  "C:/repo/src/example.mjs": {
    statementMap: {
      0: { start: { line: 4 } },
      1: { start: { line: 8 } },
      2: { start: { line: 4 } },
      3: { start: { line: 2 } },
    },
    s: { 0: 1, 1: 0, 2: 0, 3: 0 },
    branchMap: {
      0: { type: "if", line: 9, locations: [{ start: { line: 9 } }, { start: { line: 10 } }] },
    },
    b: { 0: [1, 0] },
    fnMap: { 0: { name: "run", loc: { start: { line: 12 } } } },
    f: { 0: 0 },
  },
  "C:/repo/src/covered.mjs": {
    statementMap: { 0: { start: { line: 1 } } },
    s: { 0: 1 },
    branchMap: {},
    b: {},
    fnMap: {},
    f: {},
  },
};

test("reports uncovered files, metric types, and source locations", async () => {
  const result = await formatJestCoverageFailure(
    { coverageDirectory: "C:/coverage" },
    "C:/repo",
    async () => JSON.stringify(sampleCoverage),
  );

  expect(result).toContain("Coverage gaps:");
  expect(result).toContain("src/example.mjs:");
  expect(result).toContain(
    "statements uncovered at: statement 1 at line 8, statement 2 at line 4, statement 3 at line 2",
  );
  expect(result).toContain("lines uncovered at: 2, 8");
  expect(result).toContain("branches uncovered at: line 10, if path 2");
  expect(result).toContain("functions uncovered at: run at line 12");
  expect(result).not.toContain("covered.mjs");
});

test("reports when Jest did not retain coverage evidence", async () => {
  await expect(formatJestCoverageFailure({})).resolves.toContain("details unavailable");
});

test("handles a coverage file that resolves to the repository root", async () => {
  await expect(
    formatJestCoverageFailure({ coverageDirectory: "C:/coverage" }, "C:/repo", async () =>
      JSON.stringify({ "C:/repo": null }),
    ),
  ).resolves.toBe("Coverage details contain no uncovered entries.");
});

test("reports unreadable coverage evidence", async () => {
  await expect(
    formatJestCoverageFailure({ coverageDirectory: "C:/coverage" }, "C:/repo", async () => {
      throw new Error("missing report");
    }),
  ).resolves.toContain("could not read coverage-final.json (missing report)");
});

test("supports line-only locations and reports clean coverage without gaps", async () => {
  await expect(
    formatJestCoverageFailure({ coverageDirectory: "C:/coverage" }, undefined, async () =>
      JSON.stringify({
        "src/clean.mjs": {
          statementMap: { 0: { line: 3 }, 1: { start: { line: "unknown" } } },
          s: { 0: 1 },
          branchMap: { 0: { type: "switch", line: 7, locations: [{}] } },
          b: { 0: [1] },
          fnMap: { 0: { name: "named", loc: { line: 8 } } },
          f: { 0: 1 },
        },
        "src/empty.mjs": null,
      }),
    ),
  ).resolves.toBe("Coverage details contain no uncovered entries.");
});

test("uses fallback locations for uncovered statements, branches, and functions", async () => {
  const coverage = {
    "src/partial.mjs": {
      statementMap: { 0: {}, 1: { line: 4 } },
      s: { 0: 0 },
      branchMap: {
        0: { type: "switch", line: 6, locations: [] },
        1: { type: "if", line: 9, locations: [] },
      },
      b: { 0: [0] },
      fnMap: { 0: { name: "", line: 8, loc: {} } },
      f: { 0: 0 },
    },
  };

  await expect(
    formatJestCoverageFailure({ coverageDirectory: "C:/coverage" }, undefined, async () =>
      JSON.stringify(coverage),
    ),
  ).resolves.toContain(
    "statements uncovered at: statement 0 at line unknown\n  lines uncovered at: 4\n  branches uncovered at: line 6, switch path 1\n  functions uncovered at: anonymous at line 8",
  );
});

test("handles an empty coverage report", async () => {
  await expect(
    formatJestCoverageFailure({ coverageDirectory: "C:/coverage" }, "C:/repo", async () => "null"),
  ).resolves.toBe("Coverage details contain no uncovered entries.");
});

test("uses a fallback detail for non-Error read failures", async () => {
  await expect(
    formatJestCoverageFailure({ coverageDirectory: "C:/coverage" }, "C:/repo", async () => {
      throw "blocked";
    }),
  ).resolves.toContain("coverage-final.json (blocked)");
});
