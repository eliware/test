import { mkdir, mkdtemp, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, jest, test } from "@jest/globals";
import { runCoverageCheck } from "../../../../../src/checks/general/E-0.1/E-0.1.20/run-coverage-check.mjs";
const ruleId = "E-0.1.130.14";
const run = (context, readEvidence, remove) => runCoverageCheck(context, ruleId, readEvidence, remove);

const completeEvidence = {
  totals: { statements: 100, branches: 100, functions: 100, lines: 100 },
  aggregateGaps: [],
  gaps: [],
};

test("skips coverage when Jest is disabled and rejects unavailable or failed results", async () => {
  await expect(run({ executeJest: false })).resolves.toEqual({ ruleId, status: "pass", message: "" });
  await expect(run({ executeJest: true, jestResult: { code: 1 } })).resolves.toEqual({
    ruleId,
    status: "fail",
    message: "Jest results are unavailable or indicate a failed test run.",
  });
});

test("accepts complete evidence from the coverage reader", async () => {
  await expect(run({
    root: "/repo",
    executeJest: true,
    jestResult: { code: 0, startedAt: 1 },
  }, async () => completeEvidence)).resolves.toEqual({ ruleId, status: "pass", message: "" });
});

test("reads and removes coverage evidence from the run-specific directory", async () => {
  const coverageDirectory = await mkdtemp(join(tmpdir(), "eliware-run-coverage-"));
  let options;
  const context = {
    root: "/repo",
    executeJest: true,
    jestResult: { code: 0, startedAt: 1 },
    jestCoverageDirectory: coverageDirectory,
  };
  try {
    await expect(run(context, async (_root, _stdout, _startedAt, evidenceOptions) => {
      options = evidenceOptions;
      return completeEvidence;
    })).resolves.toEqual({ ruleId, status: "pass", message: "" });
    expect(options.coverageDirectory).toBe(coverageDirectory);
    await expect(stat(coverageDirectory)).rejects.toMatchObject({ code: "ENOENT" });
    expect(context.jestCoverageDirectory).toBeUndefined();
  } finally {
    await rm(coverageDirectory, { recursive: true, force: true });
  }
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
    })).resolves.toEqual({ ruleId, status: "pass", message: "" });
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
    ruleId,
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
    ruleId,
    status: "fail",
    message: expect.stringContaining("Aggregate gaps: file-level gaps"),
  });
  await expect(run({ root: "/repo", executeJest: true, jestResult: { code: 0, startedAt: 1 } }, async () => {
    throw new Error("coverage evidence missing");
  })).resolves.toEqual({ ruleId, status: "fail", message: "coverage evidence missing" });
});

test("reports failures to clean run-scoped coverage artifacts", async () => {
  const cleanup = jest.fn(async () => { throw new Error("cleanup denied"); });
  await expect(run({
    executeJest: true,
    jestCoverageDirectory: "/run/coverage",
    jestResult: { code: 1 },
  }, undefined, cleanup)).resolves.toEqual({
    ruleId,
    status: "fail",
    message: "Jest results are unavailable or indicate a failed test run.\nCould not remove run-scoped coverage artifacts: cleanup denied",
  });
  expect(cleanup).toHaveBeenCalledWith("/run/coverage", { recursive: true, force: true });
  await expect(run({
    root: "/repo",
    executeJest: true,
    jestCoverageDirectory: "/run/coverage",
    jestResult: { code: 0, startedAt: 1 },
  }, async () => completeEvidence, cleanup)).resolves.toEqual({
    ruleId,
    status: "fail",
    message: "Could not remove run-scoped coverage artifacts: cleanup denied",
  });
  await expect(run({
    root: "/repo",
    executeJest: true,
    jestCoverageDirectory: "/run/coverage",
    jestResult: { code: 0, startedAt: 1 },
  }, async () => { throw new Error("coverage evidence is missing"); }, cleanup)).resolves.toEqual({
    ruleId,
    status: "fail",
    message: "coverage evidence is missing\nCould not remove run-scoped coverage artifacts: cleanup denied",
  });
});
