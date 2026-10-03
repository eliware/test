import { expect, jest, test } from "@jest/globals";

const runJest = jest.fn();
jest.unstable_mockModule("../../../../../src/checks/general/E-0.1/E-0.1.20/run-jest.mjs", () => ({
  runJest,
}));
const { executeJestCheck } =
  await import("../../../../../src/checks/general/E-0.1/E-0.1.20/execute-jest-check.mjs");

test("executes Jest and records its start time", async () => {
  runJest.mockImplementationOnce(async (_root, _args, _execute, options) => {
    options.onStart();
    return { code: 0, stdout: "ok", stderr: "" };
  });
  const result = await executeJestCheck({ root: ".", jestArgs: [] });
  expect(result.result).toEqual(
    expect.objectContaining({ code: 0, startedAt: expect.any(Number) }),
  );
  expect(result.timeoutDiagnostic).toBeUndefined();
});

test("preserves stderr diagnostics when stdout contains ordinary output", async () => {
  const result = { code: 0, stdout: "ordinary Jest output", stderr: "Jest diagnostic" };
  runJest.mockImplementationOnce(async (_root, _args, _execute, options) => {
    options.onStart();
    return result;
  });
  await expect(
    executeJestCheck({ root: ".", jestArgs: ["--debug-timing"] }),
  ).resolves.toMatchObject({ result: { stdout: result.stdout, stderr: result.stderr } });
});

test("rejects Jest results if execution never reached its start callback", async () => {
  runJest.mockResolvedValueOnce({ code: 0, stdout: "ok", stderr: "" });

  await expect(executeJestCheck({ root: "." })).resolves.toMatchObject({
    error: { message: "Jest did not start before the results were returned." },
  });
});

test("defaults omitted Jest arguments to an empty list", async () => {
  runJest.mockImplementationOnce(async (_root, _args, _execute, options) => {
    options.onStart();
    return { code: 0, stdout: "ok", stderr: "" };
  });
  await executeJestCheck({ root: "." });
  expect(runJest).toHaveBeenCalledWith(
    ".",
    [],
    expect.any(Function),
    expect.objectContaining({
      onTimeout: expect.any(Function),
    }),
  );
});

test("forwards the selected output writer for Jest suite progress", async () => {
  const writeOutput = jest.fn();
  runJest.mockImplementationOnce(async (_root, _args, _execute, options) => {
    options.onStart();
    return { code: 0, stdout: "captured output", stderr: "timing output" };
  });
  await executeJestCheck({ root: ".", writeOutput });
  expect(runJest).toHaveBeenCalledWith(
    ".",
    [],
    expect.any(Function),
    expect.objectContaining({
      writeOutput,
    }),
  );
});

test("forwards the invocation environment to the Jest process builder", async () => {
  const env = { PATH: "consumer-path", TOKEN: "consumer-token" };
  runJest.mockImplementationOnce(async (_root, _args, _execute, options) => {
    options.onStart();
    return { code: 0, stdout: "ok", stderr: "" };
  });
  await executeJestCheck({ root: ".", env });
  expect(runJest).toHaveBeenCalledWith(
    ".",
    [],
    expect.any(Function),
    expect.objectContaining({ env }),
  );
});

test("captures timeout diagnostics and launch errors", async () => {
  runJest.mockImplementationOnce(async (root, args, execute, options) => {
    options.onStart();
    options.onTimeout("timeout diagnostic");
    return { code: null, timedOut: true, stdout: "", stderr: "" };
  });
  await expect(
    executeJestCheck({ root: ".", jestArgs: [], writeOutput: jest.fn() }),
  ).resolves.toEqual(expect.objectContaining({ timeoutDiagnostic: "timeout diagnostic" }));
  runJest.mockImplementationOnce(() => {
    throw new Error("spawn failed");
  });
  await expect(executeJestCheck({ root: ".", jestArgs: [] })).resolves.toEqual({
    error: expect.objectContaining({ message: "spawn failed" }),
  });
});
