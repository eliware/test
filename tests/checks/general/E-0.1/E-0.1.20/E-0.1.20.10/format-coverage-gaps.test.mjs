import { expect, test } from "@jest/globals";
import { formatCoverageGaps } from "../../../../../../src/checks/general/E-0.1/E-0.1.20/E-0.1.20.10/format-coverage-gaps.mjs";

test("formats detailed coverage gaps with remediation guidance", () => {
  const output = formatCoverageGaps({
    gaps: [
      {
        file: "src/example.mjs",
        metrics: { statements: 0, branches: 50, functions: 0, lines: 0 },
        lines: [4],
        statements: [{ location: "4" }],
        branches: [{ id: "2", path: 1, type: "if", location: "6" }],
        functions: [{ name: "example", location: "8" }],
      },
    ],
  });
  expect(output).toContain("src/example.mjs | 0.00% | 50.00% | 0.00% | 0.00%");
  expect(output).toContain("Uncovered statements: 4");
  expect(output).toContain("Uncovered branches: branch 2 (if) path 1 at 6 (uncovered)");
  expect(output).toContain("Uncovered functions: example at 8");
  expect(output).toContain("Remediation: Add or extend tests");
});

test("identifies uncovered branches when Istanbul provides no source location", () => {
  const output = formatCoverageGaps({
    gaps: [
      {
        file: "src/example.mjs",
        metrics: { statements: 100, branches: 50, functions: 100, lines: 100 },
        lines: [],
        statements: [],
        branches: [{ id: "3", path: 2, location: "unknown" }],
        functions: [],
      },
    ],
  });

  expect(output).toContain("branch 3 path 2 at unknown (uncovered)");
});

test("formats empty gaps and truncates long diagnostic lists", () => {
  const output = formatCoverageGaps({
    gaps: [
      {
        file: "src/empty.mjs",
        metrics: { statements: 99, branches: 99, functions: 99, lines: 99 },
        lines: [],
        statements: [],
        branches: [],
        functions: [],
      },
      {
        file: "src/long.mjs",
        metrics: { statements: 0, branches: 0, functions: 0, lines: 0 },
        lines: [],
        statements: Array.from({ length: 21 }, (_, index) => ({ location: String(index) })),
        branches: Array.from({ length: 21 }, (_, index) => ({ location: String(index) })),
        functions: Array.from({ length: 21 }, (_, index) => ({
          name: `fn${index}`,
          location: String(index),
        })),
      },
    ],
  });
  expect(output).toContain("uncovered lines: -");
  expect(output).toContain("Uncovered statements: -");
  expect(output).toContain("(+1 more omitted)");
});

test("labels missing coverage maps as unavailable instead of zero percent", () => {
  const output = formatCoverageGaps({
    gaps: [
      {
        file: "src/missing-maps.mjs",
        metrics: { statements: null, branches: null, functions: null, lines: null },
        lines: [],
        statements: [],
        branches: [],
        functions: [],
      },
    ],
  });

  expect(output).toContain(
    "src/missing-maps.mjs | unavailable | unavailable | unavailable | unavailable",
  );
});

test("formats evidence with no gaps and still provides remediation guidance", () => {
  const output = formatCoverageGaps({ gaps: [] });
  expect(output).toContain("Coverage gaps:");
  expect(output).toContain("Istanbul ignore directives");
});
