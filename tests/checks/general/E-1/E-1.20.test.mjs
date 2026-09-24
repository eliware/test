import { beforeEach, expect, jest, test } from "@jest/globals";

const executeJestCheck = jest.fn();
const recordJestContext = jest.fn();
const classifyJestResult = jest.fn();
jest.unstable_mockModule("../../../../src/checks/general/E-1/E-1.20/execute-jest-check.mjs", () => ({ executeJestCheck }));
jest.unstable_mockModule("../../../../src/checks/general/E-1/E-1.20/record-jest-context.mjs", () => ({ recordJestContext }));
jest.unstable_mockModule("../../../../src/checks/general/E-1/E-1.20/classify-jest-result.mjs", () => ({ classifyJestResult }));

const { run } = await import("../../../../src/checks/general/E-1/E-1.20.mjs");

beforeEach(() => {
  executeJestCheck.mockClear();
  recordJestContext.mockClear();
  classifyJestResult.mockClear();
});

test("skips the Jest pipeline when execution is disabled", async () => {
  await expect(run({ executeJest: false })).resolves.toEqual({
    ruleId: "E-1.20",
    status: "pass",
    message: "",
  });
  expect(executeJestCheck).not.toHaveBeenCalled();
  expect(recordJestContext).not.toHaveBeenCalled();
  expect(classifyJestResult).not.toHaveBeenCalled();
});

test("composes execution, context recording, and result classification", async () => {
  const context = { executeJest: true };
  const result = { code: 0, stdout: "ok", stderr: "" };
  executeJestCheck.mockResolvedValueOnce({ result, timeoutDiagnostic: "timeout detail" });
  recordJestContext.mockImplementationOnce((receivedContext, receivedResult) => {
    receivedContext.jestResult = receivedResult;
  });
  classifyJestResult.mockReturnValueOnce({ ruleId: "E-1.20", status: "pass", message: "" });

  await expect(run(context)).resolves.toEqual({ ruleId: "E-1.20", status: "pass", message: "" });
  expect(executeJestCheck).toHaveBeenCalledWith(context);
  expect(recordJestContext).toHaveBeenCalledWith(context, result);
  expect(classifyJestResult).toHaveBeenCalledWith("E-1.20", result, "timeout detail");
});

test("maps execution errors without recording or classifying a result", async () => {
  executeJestCheck.mockResolvedValueOnce({ error: new Error("spawn failed") });
  await expect(run({ executeJest: true })).resolves.toEqual({
    ruleId: "E-1.20",
    status: "fail",
    message: "Jest could not be started: spawn failed",
  });
  expect(recordJestContext).not.toHaveBeenCalled();
  expect(classifyJestResult).not.toHaveBeenCalled();
});
