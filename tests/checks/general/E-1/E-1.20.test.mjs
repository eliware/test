import { expect, jest, test } from "@jest/globals";

const runJest = jest.fn();
jest.unstable_mockModule("../../../../src/checks/general/E-1/E-1.20/run-jest.mjs", () => ({
  runJest,
}));

const { run } = await import("../../../../src/checks/general/E-1/E-1.20.mjs");

test("skips Jest execution for orchestration-only seams", async () => {
  await expect(run({ executeJest: false })).resolves.toEqual({
    ruleId: "E-1.20",
    status: "pass",
    message: "",
  });
  expect(runJest).not.toHaveBeenCalled();
});

test("passes after a successful Jest run", async () => {
  runJest.mockResolvedValueOnce({ code: 0, stdout: "all tests passed", stderr: "" });

  await expect(run({ root: ".", executeJest: true, jestArgs: [] })).resolves.toEqual({
    ruleId: "E-1.20",
    status: "pass",
    message: "",
  });
  expect(runJest).toHaveBeenCalledWith(".", [], expect.any(Function), expect.objectContaining({ onTimeout: expect.any(Function) }));
});

test("uses an empty argument list when none is configured", async () => {
  runJest.mockResolvedValueOnce({ code: 0, stdout: "", stderr: "" });
  await expect(run({ root: ".", executeJest: true })).resolves.toEqual({
    ruleId: "E-1.20",
    status: "pass",
    message: "",
  });
  expect(runJest).toHaveBeenCalledWith(".", [], expect.any(Function), expect.objectContaining({ onTimeout: expect.any(Function) }));
});

test("streams stderr when debug output is enabled", async () => {
  runJest.mockResolvedValueOnce({ code: 0, stdout: "", stderr: "" });
  const writeOutput = jest.fn();
  await expect(run({ root: ".", executeJest: true, jestArgs: ["--debug-timing"], writeOutput })).resolves.toEqual({
    ruleId: "E-1.20",
    status: "pass",
    message: "",
  });
  expect(runJest).toHaveBeenCalledWith(".", ["--debug-timing"], expect.any(Function), expect.objectContaining({ onStderr: writeOutput, onTimeout: expect.any(Function) }));
});

test("uses empty Jest arguments while streaming when arguments are absent", async () => {
  runJest.mockResolvedValueOnce({ code: 0, stdout: "", stderr: "" });
  const writeOutput = jest.fn();
  await run({ root: ".", executeJest: true, writeOutput });
  expect(runJest).toHaveBeenCalledWith(".", [], expect.any(Function), expect.objectContaining({ onStderr: writeOutput, onTimeout: expect.any(Function) }));
});

test("reports a no-progress timeout", async () => {
  const onTimeout = jest.fn();
  runJest.mockImplementationOnce(async (root, args, execute, options) => {
    options.onTimeout("Test suite tests/hanging.test.mjs timed out after 15 seconds without progress.");
    return { code: null, timedOut: true, stdout: "", stderr: "" };
  });
  await expect(run({ root: ".", executeJest: true, jestArgs: [], writeOutput: onTimeout })).resolves.toEqual({
    ruleId: "E-1.20",
    status: "fail",
    message: "Test suite tests/hanging.test.mjs timed out after 15 seconds without progress.",
  });
});

test("uses the fallback timeout diagnostic and records Jest output timing", async () => {
  runJest.mockResolvedValueOnce({ code: null, timedOut: true, stdout: "captured", stderr: "" });
  const setJestOutput = jest.fn();
  await expect(run({ root: ".", executeJest: true, timing: { setJestOutput } })).resolves.toEqual({
    ruleId: "E-1.20",
    status: "fail",
    message: "Jest timed out after 15 seconds without progress.",
  });
  expect(setJestOutput).toHaveBeenCalledWith("captured");
});

test("preserves both Jest stdout and stderr on test failure", async () => {
  runJest.mockResolvedValueOnce({
    code: 1,
    stdout: "FAIL tests/example.test.mjs",
    stderr: "Expected: 1\nReceived: 2",
  });

  await expect(run({ root: ".", executeJest: true, jestArgs: [] })).resolves.toEqual({
    ruleId: "E-1.20",
    status: "fail",
    message: "Jest failed: FAIL tests/example.test.mjs\nExpected: 1\nReceived: 2",
  });
});

test("reports a launch failure", async () => {
  runJest.mockRejectedValueOnce(new Error("spawn failed"));

  await expect(run({ root: ".", executeJest: true, jestArgs: [] })).resolves.toEqual({
    ruleId: "E-1.20",
    status: "fail",
    message: "Jest could not be started: spawn failed",
  });
});

test("reports a failed Jest run without output", async () => {
  runJest.mockResolvedValueOnce({ code: 1, stdout: "", stderr: "" });
  await expect(run({ root: ".", executeJest: true, jestArgs: [] })).resolves.toEqual({
    ruleId: "E-1.20",
    status: "fail",
    message: "Jest failed without diagnostics.",
  });
});
