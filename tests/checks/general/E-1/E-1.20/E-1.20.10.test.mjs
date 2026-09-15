import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { run } from "../../../../../src/checks/general/E-1/E-1.20/E-1.20.10.mjs";

async function fixture(total) {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-e-1-20-10-"));
  await mkdir(join(root, "coverage"));
  await writeFile(join(root, "coverage", "coverage-final.json"), JSON.stringify({
    "src/example.mjs": {
      statementMap: { 0: { start: { line: 1, column: 0 } } }, s: { 0: total.statements.pct === 100 ? 1 : 0 },
      branchMap: { 0: { locations: [{ start: { line: 1, column: 0 } }] } }, b: { 0: [total.branches.pct === 100 ? 1 : 0] },
      fnMap: { 0: { name: "example", start: { line: 1, column: 0 } } }, f: { 0: total.functions.pct === 100 ? 1 : 0 },
      l: { 1: total.lines.pct === 100 ? 1 : 0 },
    },
  }));
  return root;
}

const complete = Object.fromEntries(
  ["statements", "branches", "functions", "lines"].map((metric) => [metric, { pct: 100 }]),
);

test("passes when Jest reports 100% for all four coverage metrics", async () => {
  const root = await fixture(complete);
  await expect(run({ root, executeJest: true, jestResult: { code: 0, startedAt: 1 } })).resolves.toEqual({
    ruleId: "E-1.20.10",
    status: "pass",
    message: "",
  });
  await rm(root, { recursive: true, force: true });
});

test("passes when fresh evidence is complete", async () => {
  await expect(
    run(
      { root: "fixture", executeJest: true, jestResult: { code: 0, startedAt: 1 } },
      async () => ({ totals: { statements: 100, branches: 100, functions: 100, lines: 100 }, gaps: [] }),
    ),
  ).resolves.toEqual({ ruleId: "E-1.20.10", status: "pass", message: "" });
});

test("reports every coverage metric below 100%", async () => {
  const root = await fixture({
    statements: { pct: 99 },
    branches: { pct: 98 },
    functions: { pct: 97 },
    lines: { pct: 96 },
  });
  await expect(run({ root, executeJest: true, jestResult: { code: 0, startedAt: 1 } })).resolves.toEqual(
    expect.objectContaining({
      ruleId: "E-1.20.10",
      status: "fail",
      message: expect.stringContaining("Aggregate gaps: statements, branches, functions, lines."),
    }),
  );
  await rm(root, { recursive: true, force: true });
});

test("fails when Jest does not produce a coverage summary", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-e-1-20-10-"));
  await expect(run({ root, executeJest: true, jestResult: { code: 0, startedAt: 1 } })).resolves.toEqual({
    ruleId: "E-1.20.10",
    status: "fail",
    message: "Coverage evidence is missing. Rerun Jest with coverage enabled.",
  });
  await rm(root, { recursive: true, force: true });
});

test("does not require Jest evidence for orchestration-only test seams", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-e-1-20-10-"));
  await expect(run({ root, executeJest: false })).resolves.toEqual({
    ruleId: "E-1.20.10",
    status: "pass",
    message: "",
  });
  await rm(root, { recursive: true, force: true });
});

test("passes without a Jest execution context", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-e-1-20-10-"));
  await expect(run({ root })).resolves.toEqual({
    ruleId: "E-1.20.10",
    status: "pass",
    message: "",
  });
  await rm(root, { recursive: true, force: true });
});

test("fails when the Jest execution failed or returned no result", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-e-1-20-10-"));
  await expect(run({ root, executeJest: true, jestResult: { code: 1 } })).resolves.toEqual({
    ruleId: "E-1.20.10",
    status: "fail",
    message: "Jest results are unavailable or indicate a failed test run.",
  });
  await expect(run({ root, executeJest: true })).resolves.toEqual({
    ruleId: "E-1.20.10",
    status: "fail",
    message: "Jest results are unavailable or indicate a failed test run.",
  });
  await rm(root, { recursive: true, force: true });
});

test("reports file-level coverage gaps from detailed evidence", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-e-1-20-10-"));
  await mkdir(join(root, "coverage"));
  await writeFile(
    join(root, "coverage", "coverage-final.json"),
    JSON.stringify({
      "src/example.mjs": {
        s: { 0: 0 },
        b: { 0: [1, 0] },
        f: { 0: 0 },
        l: { 1: 0 },
        statementMap: { 0: { start: { line: 1 } } },
        branchMap: { 0: { locations: [{ start: { line: 2 } }, { start: { line: 3 } }] } },
        fnMap: { 0: { name: "example", start: { line: 4 } } },
      },
    }),
  );
  await expect(run({ root, executeJest: true, jestResult: { code: 0, startedAt: 1 } })).resolves.toEqual(
    expect.objectContaining({
      ruleId: "E-1.20.10",
      status: "fail",
      message: expect.stringContaining("src/example.mjs"),
    }),
  );
  await rm(root, { recursive: true, force: true });
});

test("reports file-level gaps even when aggregate metrics are complete", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-e-1-20-10-"));
  await expect(
    run(
      { root, executeJest: true, jestResult: { code: 0, startedAt: 1 } },
      async () => ({
        totals: { statements: 100, branches: 100, functions: 100, lines: 100 },
        gaps: [{
          file: "src/example.mjs",
          metrics: { statements: 99, branches: 99, functions: 99, lines: 99 },
          lines: [],
          statements: [],
          branches: [],
          functions: [],
        }],
      }),
    ),
  ).resolves.toEqual(
    expect.objectContaining({
      ruleId: "E-1.20.10",
      status: "fail",
      message: expect.stringContaining("Aggregate gaps: file-level gaps."),
    }),
  );
  await rm(root, { recursive: true, force: true });
});
