import { expect, jest, test } from "@jest/globals";

const runJest = jest.fn();
jest.unstable_mockModule("../../../../../src/checks/general/E-1/E-1.20/run-jest.mjs", () => ({ runJest }));
const { executeJestCheck } = await import(
  "../../../../../src/checks/general/E-1/E-1.20/execute-jest-check.mjs",
);

test("executes Jest and records its start time", async () => {
  runJest.mockResolvedValueOnce({ code: 0, stdout: "ok", stderr: "" });
  const result = await executeJestCheck({ root: ".", jestArgs: [] });
  expect(result.result).toEqual(expect.objectContaining({ code: 0, startedAt: expect.any(Number) }));
  expect(result.timeoutDiagnostic).toBeUndefined();
});

test("captures timeout diagnostics and launch errors", async () => {
  runJest.mockImplementationOnce(async (root, args, execute, options) => {
    options.onTimeout("timeout diagnostic");
    return { code: null, timedOut: true, stdout: "", stderr: "" };
  });
  await expect(executeJestCheck({ root: ".", jestArgs: [], writeOutput: jest.fn() })).resolves.toEqual(
    expect.objectContaining({ timeoutDiagnostic: "timeout diagnostic" }),
  );
  runJest.mockRejectedValueOnce(new Error("spawn failed"));
  await expect(executeJestCheck({ root: ".", jestArgs: [] })).resolves.toEqual({
    error: expect.objectContaining({ message: "spawn failed" }),
  });
});
