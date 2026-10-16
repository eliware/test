import { expect, jest, test } from "@jest/globals";
import { runJestValidationStage } from "../../../../../../../src/validation/stages/jest/execution/run/jest/validation-stage.mjs";

test("passes clean Jest results and records aggregate counts", async () => {
  const context = {
    root: ".",
    jestResult: {
      code: 0,
      startedAt: 100,
      consoleOutput: [],
      stderr: '[eliware-test-progress] {"event":"run-complete","testSuites":3,"tests":17}',
    },
    validationSummary: {},
  };
  const runJest = jest.fn(async () => ({ ruleId: "stage:jest", status: "pass", message: "" }));
  await expect(runJestValidationStage(context, runJest)).resolves.toMatchObject({
    stage: "jest",
    code: 0,
    status: "pass",
    output: context.jestResult,
  });
  expect(runJest).toHaveBeenCalledWith(context, "stage:jest");
  expect(context.validationSummary).toMatchObject({
    jestCounts: { testSuites: 3, tests: 17 },
  });
  expect(context.validationSummary.jestTimeMs).toBeGreaterThanOrEqual(0);
});

test("records Jest time when the process result has no start time", async () => {
  const context = {
    root: ".",
    jestResult: {
      code: 0,
      stdout: '[eliware-test-progress] {"event":"run-complete","testSuites":1,"tests":1}',
    },
    validationSummary: {},
  };
  await expect(
    runJestValidationStage(context, async () => ({ status: "pass", message: "" })),
  ).resolves.toMatchObject({ code: 0 });
  expect(context.validationSummary.jestTimeMs).toBeGreaterThanOrEqual(0);
});

test("rejects a passing Jest process without a completion event", async () => {
  const context = {
    root: ".",
    jestResult: {
      code: 0,
      stdout:
        'ordinary output\n[eliware-test-progress] {"event":"start"}\n[eliware-test-progress] {bad-json}',
    },
    validationSummary: {},
  };
  await expect(
    runJestValidationStage(context, async () => ({ status: "pass", message: "" })),
  ).resolves.toMatchObject({
    code: 2,
    status: "fail",
    message: "Jest completed without running at least one test in one suite.",
  });
  expect(context.validationSummary.jestCounts).toBeUndefined();
});

test.each([
  [0, 0],
  [1, 0],
])(
  "rejects a passing Jest report with counts %i suites and %i tests",
  async (testSuites, tests) => {
    const context = {
      root: ".",
      jestResult: {
        code: 0,
        stderr: `[eliware-test-progress] ${JSON.stringify({ event: "run-complete", testSuites, tests })}`,
      },
    };
    await expect(
      runJestValidationStage(context, async () => ({ status: "pass", message: "" })),
    ).resolves.toMatchObject({ code: 2, status: "fail" });
  },
);

test("fails when Jest reports unexpected test console output", async () => {
  const context = {
    root: ".",
    env: {},
    jestResult: {
      code: 0,
      stderr: '[eliware-test-progress] {"event":"run-complete","testSuites":1,"tests":1}',
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

test("adds coverage details when Jest reports a coverage threshold failure", async () => {
  const context = {
    root: ".",
    jestResult: { code: 1, coverageDirectory: "coverage" },
  };
  await expect(
    runJestValidationStage(
      context,
      async () => ({ status: "fail", message: "Coverage threshold was not met." }),
      async () => "{}",
    ),
  ).resolves.toMatchObject({
    code: 4,
    message: "Coverage threshold was not met.\nCoverage details contain no uncovered entries.",
  });
});
