import { beforeEach, expect, jest, test } from "@jest/globals";

const executeJestCheck = jest.fn();
const recordJestContext = jest.fn();
const classifyJestResult = jest.fn();
const validateTestIsolationPolicy = jest.fn();
jest.unstable_mockModule(
  "../../../../../../../src/validation/stages/jest/execution/execute/jest-check.mjs",
  () => ({ executeJestCheck }),
);
jest.unstable_mockModule(
  "../../../../../../../src/validation/stages/jest/execution/record-jest-context.mjs",
  () => ({ recordJestContext }),
);
jest.unstable_mockModule(
  "../../../../../../../src/validation/stages/jest/execution/classify-jest-result.mjs",
  () => ({ classifyJestResult }),
);
jest.unstable_mockModule(
  "../../../../../../../src/validation/harness/validate-test-isolation-policy.mjs",
  () => ({ validateTestIsolationPolicy }),
);

const { runJestStage } =
  await import("../../../../../../../src/validation/stages/jest/execution/run/jest/stage.mjs");
const ruleId = "E-0.1.130.13";
const run = (context) => runJestStage(context, ruleId);

beforeEach(() => {
  executeJestCheck.mockClear();
  recordJestContext.mockClear();
  classifyJestResult.mockClear();
  validateTestIsolationPolicy.mockReset().mockResolvedValue([]);
});

test("skips the Jest pipeline when execution is disabled", async () => {
  await expect(run({ executeJest: false })).resolves.toEqual({
    ruleId,
    status: "pass",
    message: "",
  });
  expect(executeJestCheck).not.toHaveBeenCalled();
  expect(validateTestIsolationPolicy).not.toHaveBeenCalled();
  expect(recordJestContext).not.toHaveBeenCalled();
  expect(classifyJestResult).not.toHaveBeenCalled();
});

test("composes execution, context recording, and result classification", async () => {
  const context = { executeJest: true, writeOutput: jest.fn() };
  const result = { code: 0, stdout: "ok", stderr: "" };
  executeJestCheck.mockResolvedValueOnce({ result, timeoutDiagnostic: "timeout detail" });
  recordJestContext.mockImplementationOnce((receivedContext, receivedResult) => {
    receivedContext.jestResult = receivedResult;
  });
  classifyJestResult.mockReturnValueOnce({ ruleId, status: "pass", message: "" });

  await expect(run(context)).resolves.toEqual({ ruleId, status: "pass", message: "" });
  expect(executeJestCheck).toHaveBeenCalledWith(context);
  expect(validateTestIsolationPolicy).toHaveBeenCalledWith(undefined);
  expect(recordJestContext).toHaveBeenCalledWith(context, result);
  expect(classifyJestResult).toHaveBeenCalledWith(ruleId, result, "timeout detail", {
    failuresReported: false,
  });
});

test("reports failure details only when the Jest progress handler emitted them", async () => {
  const context = { executeJest: true, writeOutput: jest.fn() };
  const result = { code: 1, stdout: "assertion failed", stderr: "" };
  executeJestCheck.mockImplementationOnce(async (receivedContext) => {
    receivedContext.jestFailureDetailsReported = true;
    return { result };
  });
  recordJestContext.mockImplementationOnce((receivedContext, receivedResult) => {
    receivedContext.jestResult = receivedResult;
  });
  classifyJestResult.mockReturnValueOnce({ ruleId, status: "fail", message: "" });

  await run(context);

  expect(classifyJestResult).toHaveBeenCalledWith(ruleId, result, undefined, {
    failuresReported: true,
  });
});

test("rejects test suites that use filesystem write APIs before Jest starts", async () => {
  const context = { executeJest: true, root: "/repo" };
  validateTestIsolationPolicy.mockResolvedValueOnce([
    "tests/example.test.mjs:2 uses a forbidden test API: import of writeFile.",
  ]);
  await expect(run(context)).resolves.toEqual({
    ruleId,
    status: "fail",
    message: "tests/example.test.mjs:2 uses a forbidden test API: import of writeFile.",
  });
  expect(executeJestCheck).not.toHaveBeenCalled();
});

test("maps execution errors without recording or classifying a result", async () => {
  const context = { executeJest: true };
  executeJestCheck.mockResolvedValueOnce({ error: new Error("spawn failed") });
  await expect(run(context)).resolves.toEqual({
    ruleId,
    status: "fail",
    message: "Jest could not be started: spawn failed",
  });
  expect(context.jestExecutionError).toBe("spawn failed");
  expect(recordJestContext).not.toHaveBeenCalled();
  expect(classifyJestResult).not.toHaveBeenCalled();
});

test("maps unexpected execution throws to a stable Jest startup failure", async () => {
  executeJestCheck.mockRejectedValueOnce(new Error("preparation failed"));
  await expect(run({ executeJest: true })).resolves.toEqual({
    ruleId,
    status: "fail",
    message: "Jest could not be started: preparation failed",
  });
});
