import { expect, jest, test } from "@jest/globals";
import { runJestValidationStage } from "../../../../src/orchestration/general/E-0.1/run-jest-validation-stage.mjs";

test("passes a clean Jest result and keeps its output", async () => {
  const context = { root: ".", jestResult: { code: 0, consoleOutput: [] } };
  const runJest = jest.fn(async () => ({ ruleId: "stage:jest", status: "pass", message: "" }));
  await expect(runJestValidationStage(context, runJest)).resolves.toMatchObject({
    stage: "jest",
    code: 0,
    status: "pass",
    output: context.jestResult,
  });
  expect(runJest).toHaveBeenCalledWith(context, "stage:jest");
});

test("fails when Jest reports unexpected test console output", async () => {
  const context = {
    root: ".",
    env: {},
    jestResult: {
      code: 0,
      consoleOutput: [
        {
          testFilePath: "tests/example.test.mjs",
          type: "log",
          message: "leaked message",
        },
      ],
    },
  };
  await expect(
    runJestValidationStage(context, async () => ({
      ruleId: "stage:jest",
      status: "pass",
      message: "",
    })),
  ).resolves.toMatchObject({
    code: 3,
    status: "fail",
    message: expect.stringContaining("Unexpected test-process output detected"),
  });
});

test("keeps Jest failures and startup errors as stage failures", async () => {
  const context = { root: ".", env: {}, jestResult: { code: 1 } };
  await expect(
    runJestValidationStage(context, async () => ({
      ruleId: "stage:jest",
      status: "fail",
      message: "Jest failed",
    })),
  ).resolves.toMatchObject({ code: 2, status: "fail" });
  await expect(
    runJestValidationStage(context, async () => ({
      ruleId: "stage:jest",
      status: "fail",
      message: "Jest could not be started: missing executable",
    })),
  ).resolves.toMatchObject({ code: 1, status: "fail" });
});

test("uses the coverage code for a Jest coverage threshold failure", async () => {
  const context = {
    root: ".",
    jestResult: {
      code: 1,
      stdout: "Test Suites: 5 passed, 5 total\nJest: global coverage threshold not met",
    },
  };
  await expect(
    runJestValidationStage(context, async () => ({
      ruleId: "stage:jest",
      status: "fail",
      message: "Jest failed: Jest: global coverage threshold not met",
    })),
  ).resolves.toMatchObject({ code: 4, status: "fail" });
});

test("classifies Jest's reported global coverage wording with code 4", async () => {
  const context = {
    root: ".",
    jestResult: {
      code: 1,
      stdout: 'Jest: Coverage for statements (99.92%) does not meet "global" threshold (100%)',
    },
  };
  await expect(
    runJestValidationStage(context, async () => ({
      ruleId: "stage:jest",
      status: "fail",
      message: 'Jest: Coverage for statements (99.92%) does not meet "global" threshold (100%)',
    })),
  ).resolves.toMatchObject({ code: 4, status: "fail" });
});

test("adds coverage file and location details to the stage failure", async () => {
  const context = {
    root: "C:/repo",
    jestResult: {
      code: 1,
      coverageDirectory: "C:/coverage",
      stdout: 'Jest: Coverage for statements (99.92%) does not meet "global" threshold (100%)',
    },
  };
  const coverage = {
    "C:/repo/src/example.mjs": {
      statementMap: { 0: { start: { line: 17 } } },
      s: { 0: 0 },
      branchMap: {},
      b: {},
      fnMap: {},
      f: {},
    },
  };
  const result = await runJestValidationStage(
    context,
    async () => ({
      ruleId: "stage:jest",
      status: "fail",
      message: "Jest failed: coverage threshold failure",
    }),
    async () => JSON.stringify(coverage),
  );

  expect(result).toMatchObject({ code: 4, status: "fail" });
  expect(result.message).toContain("src/example.mjs");
  expect(result.message).toContain("statements uncovered at: statement 0 at line 17");
});
