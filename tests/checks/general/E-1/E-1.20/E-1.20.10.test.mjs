import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { run } from "../../../../../src/checks/general/E-1/E-1.20/E-1.20.10.mjs";

const completeEvidence = {
  totals: { statements: 100, branches: 100, functions: 100, lines: 100 },
  aggregateGaps: [],
  gaps: [],
};

test("skips coverage when Jest is disabled and rejects unavailable or failed results", async () => {
  await expect(run({ executeJest: false })).resolves.toEqual({ ruleId: "E-1.20.10", status: "pass", message: "" });
  await expect(run({ executeJest: true, jestResult: { code: 1 } })).resolves.toEqual({
    ruleId: "E-1.20.10",
    status: "fail",
    message: "Jest results are unavailable or indicate a failed test run.",
  });
});

test("accepts complete evidence from the coverage reader", async () => {
  await expect(run({
    root: "/repo",
    executeJest: true,
    jestResult: { code: 0, startedAt: 1 },
  }, async () => completeEvidence)).resolves.toEqual({ ruleId: "E-1.20.10", status: "pass", message: "" });
});

test("constrains focused evidence to the matching source file", async () => {
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

test("maps aggregate and file-level gaps and evidence-reader errors to failures", async () => {
  await expect(run({ root: "/repo", executeJest: true, jestResult: { code: 0, startedAt: 1 } }, async () => ({
    ...completeEvidence,
    totals: { ...completeEvidence.totals, statements: 99 },
  }))).resolves.toMatchObject({
    ruleId: "E-1.20.10",
    status: "fail",
    message: expect.stringContaining("Aggregate gaps: statements"),
  });
  await expect(run({ root: "/repo", executeJest: true, jestResult: { code: 0, startedAt: 1 } }, async () => ({
    ...completeEvidence,
    gaps: [{
      file: "src/example.mjs",
      metrics: { statements: 99, branches: 100, functions: 100, lines: 99 },
      lines: [],
      statements: [],
      branches: [],
      functions: [],
    }],
  }))).resolves.toMatchObject({
    ruleId: "E-1.20.10",
    status: "fail",
    message: expect.stringContaining("Aggregate gaps: file-level gaps"),
  });
  await expect(run({ root: "/repo", executeJest: true, jestResult: { code: 0, startedAt: 1 } }, async () => {
    throw new Error("coverage evidence missing");
  })).resolves.toEqual({ ruleId: "E-1.20.10", status: "fail", message: "coverage evidence missing" });
});
