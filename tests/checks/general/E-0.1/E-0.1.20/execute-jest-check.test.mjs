import { expect, jest, test } from "@jest/globals";

const runJest = jest.fn();
jest.unstable_mockModule("../../../../../src/checks/general/E-0.1/E-0.1.20/run-jest.mjs", () => ({ runJest }));
const { executeJestCheck } = await import(
  "../../../../../src/checks/general/E-0.1/E-0.1.20/execute-jest-check.mjs",
);

test("executes Jest and records its start time", async () => {
  runJest.mockResolvedValueOnce({ code: 0, stdout: "ok", stderr: "" });
  const result = await executeJestCheck({ root: ".", jestArgs: [] });
  expect(result.result).toEqual(expect.objectContaining({ code: 0, startedAt: expect.any(Number) }));
  expect(result.timeoutDiagnostic).toBeUndefined();
});

test("preserves stderr timing JSON when stdout contains ordinary output", async () => {
  const result = { code: 0, stdout: "ordinary Jest output", stderr: '{"numFailedTestSuites":0}' };
  runJest.mockResolvedValueOnce(result);
  await expect(executeJestCheck({ root: ".", jestArgs: ["--debug-timing"] }))
    .resolves.toMatchObject({ result: { stdout: result.stdout, stderr: result.stderr } });
});

test("defaults omitted Jest arguments to an empty list", async () => {
  runJest.mockResolvedValueOnce({ code: 0, stdout: "ok", stderr: "" });
  await executeJestCheck({ root: "." });
  expect(runJest).toHaveBeenCalledWith(".", [], expect.any(Function), expect.objectContaining({
    onStderr: undefined,
    onTimeout: expect.any(Function),
  }));
});

test("forwards the invocation environment to the Jest process builder", async () => {
  const env = { PATH: "consumer-path", TOKEN: "consumer-token" };
  runJest.mockResolvedValueOnce({ code: 0, stdout: "ok", stderr: "" });
  await executeJestCheck({ root: ".", env });
  expect(runJest).toHaveBeenCalledWith(".", [], expect.any(Function), expect.objectContaining({ env }));
});

test("captures timeout diagnostics and launch errors", async () => {
  runJest.mockImplementationOnce(async (root, args, execute, options) => {
    options.onTimeout("timeout diagnostic");
    return { code: null, timedOut: true, stdout: "", stderr: "" };
  });
  await expect(executeJestCheck({ root: ".", jestArgs: [], writeOutput: jest.fn() })).resolves.toEqual(
    expect.objectContaining({ timeoutDiagnostic: "timeout diagnostic" }),
  );
  runJest.mockImplementationOnce(() => { throw new Error("spawn failed"); });
  await expect(executeJestCheck({ root: ".", jestArgs: [] })).resolves.toEqual({
    error: expect.objectContaining({ message: "spawn failed" }),
  });
});
