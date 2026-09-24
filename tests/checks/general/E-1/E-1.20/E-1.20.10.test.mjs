import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { run } from "../../../../../src/checks/general/E-1/E-1.20/E-1.20.10.mjs";

const completeEvidence = {
  totals: { statements: 100, branches: 100, functions: 100, lines: 100 },
  gaps: [],
};

test("skips coverage validation when Jest did not execute", async () => {
  await expect(run({ executeJest: false })).resolves.toEqual({
    ruleId: "E-1.20.10",
    status: "pass",
    message: "",
  });
  await expect(run({})).resolves.toEqual({ ruleId: "E-1.20.10", status: "pass", message: "" });
});

test("requires a successful Jest result before examining coverage", async () => {
  await expect(run({ executeJest: true, jestResult: { code: 1 } })).resolves.toEqual({
    ruleId: "E-1.20.10",
    status: "fail",
    message: "Jest results are unavailable or indicate a failed test run.",
  });
  await expect(run({ executeJest: true })).resolves.toEqual(expect.objectContaining({ status: "fail" }));
});

test("accepts fresh complete detailed coverage through the default reader", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-coverage-pipeline-"));
  try {
    await mkdir(join(root, "coverage"));
    await writeFile(join(root, "coverage", "coverage-final.json"), JSON.stringify({
      "src/example.mjs": {
        statementMap: { 0: { start: { line: 1, column: 0 } } },
        s: { 0: 1 },
        branchMap: { 0: { locations: [{ start: { line: 1, column: 0 } }] } },
        b: { 0: [1] },
        fnMap: { 0: { name: "example", start: { line: 1, column: 0 } } },
        f: { 0: 1 },
        l: { 1: 1 },
      },
    }));
    await expect(run({ root, executeJest: true, jestResult: { code: 0, startedAt: 1 } })).resolves.toEqual({
      ruleId: "E-1.20.10",
      status: "pass",
      message: "",
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("passes focused-file expectations to the evidence reader", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-focused-coverage-"));
  await mkdir(join(root, "src"));
  await writeFile(join(root, "src", "example.mjs"), "export const value = 1;\n");
  let options;
  try {
    await expect(run({
      root,
      executeJest: true,
      jestArgs: ["tests/example.test.mjs"],
      jestResult: { code: 0, startedAt: 1 },
    }, async (_root, _stdout, _startedAt, evidenceOptions) => {
      options = evidenceOptions;
      return completeEvidence;
    })).resolves.toEqual({ ruleId: "E-1.20.10", status: "pass", message: "" });
    expect(options).toEqual({ requireFresh: true, expectedFiles: ["src/example.mjs"] });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("maps coverage gaps and evidence-reader errors into rule failures", async () => {
  await expect(run({
    root: "fixture",
    executeJest: true,
    jestResult: { code: 0, startedAt: 1 },
  }, async () => ({
    ...completeEvidence,
    totals: { statements: 99, branches: 100, functions: 100, lines: 100 },
    aggregateGaps: ["statements"],
  }))).resolves.toMatchObject({
    ruleId: "E-1.20.10",
    status: "fail",
    message: expect.stringContaining("Aggregate gaps: statements"),
  });
  await expect(run({
    root: "fixture",
    executeJest: true,
    jestResult: { code: 0, startedAt: 1 },
  }, async () => ({
    ...completeEvidence,
    gaps: [{
      file: "src/example.mjs",
      metrics: { statements: 99, branches: 100, functions: 100, lines: 100 },
      lines: [], statements: [], branches: [], functions: [],
    }],
  }))).resolves.toMatchObject({
    ruleId: "E-1.20.10",
    status: "fail",
    message: expect.stringContaining("Aggregate gaps: file-level gaps"),
  });
  await expect(run({
    root: "fixture",
    executeJest: true,
    jestResult: { code: 0, startedAt: 1 },
  }, async () => { throw new Error("coverage is missing"); })).resolves.toEqual({
    ruleId: "E-1.20.10",
    status: "fail",
    message: "coverage is missing",
  });
});
