import { beforeEach, expect, jest, test } from "@jest/globals";

const prepareJestRun = jest.fn();
const resolveJestCli = jest.fn();
const executePreparedJestRun = jest.fn();
const attachJestConsoleOutput = jest.fn();
const createJestConsoleOutputLog = jest.fn();
const start = jest.fn();
const append = jest.fn();
const finish = jest.fn();

jest.unstable_mockModule(
  "../../../../../../src/validation/stages/jest/execution/prepare-jest-run.mjs",
  () => ({
    prepareJestRun,
  }),
);
jest.unstable_mockModule(
  "../../../../../../src/validation/stages/jest/configuration/resolve/jest/cli.mjs",
  () => ({
    resolveJestCli,
  }),
);
jest.unstable_mockModule(
  "../../../../../../src/validation/stages/jest/execution/execute/prepared-jest-run.mjs",
  () => ({
    executePreparedJestRun,
  }),
);
jest.unstable_mockModule(
  "../../../../../../src/validation/stages/jest/progress/attach-jest-console-output.mjs",
  () => ({
    attachJestConsoleOutput,
  }),
);
jest.unstable_mockModule(
  "../../../../../../src/validation/stages/jest/progress/create/jest/console/output-log.mjs",
  () => ({
    createJestConsoleOutputLog,
  }),
);

const { runJest } =
  await import("../../../../../../src/validation/stages/jest/execution/run/jest.mjs");

const prepared = {
  consoleOutputFile: "coverage/jest-console-events.json",
  coverageDirectory: "coverage",
  options: {},
};

beforeEach(() => {
  prepareJestRun.mockReset().mockImplementation(async (root, _args, resolveCli) => {
    resolveCli(root);
    return prepared;
  });
  resolveJestCli.mockReset().mockReturnValue("jest-cli");
  executePreparedJestRun.mockReset().mockResolvedValue({ code: 0, stdout: "passed", stderr: "" });
  attachJestConsoleOutput.mockReset().mockImplementation(async (_prepared, result) => ({
    ...result,
    consoleOutput: [{ testFilePath: "tests/example.test.mjs", type: "log", message: "output" }],
  }));
  start.mockReset();
  append.mockReset();
  finish.mockReset().mockReturnValue({ redacted: false, writeError: false });
  createJestConsoleOutputLog.mockReset().mockReturnValue({ start, append, finish });
});

test("prepares and runs Jest, then returns the saved report and coverage location", async () => {
  const onStart = jest.fn();
  executePreparedJestRun.mockImplementation(async ({ options }) => {
    options.onRawStdout("passed");
    options.onRawStderr("diagnostic");
    return { code: 0, stdout: "passed", stderr: "" };
  });
  await expect(runJest("repo", [], jest.fn(), { onStart })).resolves.toMatchObject({
    code: 0,
    coverageDirectory: "coverage",
    consoleOutput: [{ message: "output" }],
  });
  expect(prepareJestRun).toHaveBeenCalledWith("repo", [], expect.any(Function), { onStart });
  expect(start).toHaveBeenCalledTimes(1);
  expect(append).toHaveBeenNthCalledWith(1, "stdout", "passed");
  expect(append).toHaveBeenNthCalledWith(2, "stderr", "diagnostic");
  expect(finish).toHaveBeenCalledTimes(1);
  expect(onStart).toHaveBeenCalledTimes(1);
});

test("uses default arguments and marks redaction or log-write failures", async () => {
  finish.mockReturnValue({ redacted: true, redactionKinds: ["environment"], writeError: true });
  await expect(runJest("repo", undefined, jest.fn())).resolves.toMatchObject({
    code: 0,
    outputRedacted: true,
    outputRedactionKinds: ["environment"],
    outputLogError: true,
  });
  expect(prepareJestRun).toHaveBeenCalledWith("repo", [], expect.any(Function), undefined);
});

test("keeps timeout output open when termination is not confirmed", async () => {
  executePreparedJestRun.mockResolvedValue({
    code: null,
    timedOut: true,
    terminationConfirmed: false,
  });
  const result = await runJest("repo", [], jest.fn());
  expect(result.terminationConfirmed).toBe(false);
  expect(finish).not.toHaveBeenCalled();
  expect(attachJestConsoleOutput).not.toHaveBeenCalled();
});

test("finishes the log after execution errors and then rethrows", async () => {
  executePreparedJestRun.mockImplementation(async ({ options }) => {
    options.onRawStdout("partial");
    throw new Error("runner failed");
  });
  await expect(
    runJest("repo", [], jest.fn(), { env: { API_TOKEN: "very-secret-value" } }),
  ).rejects.toThrow("runner failed");
  expect(append).toHaveBeenCalledWith("stdout", "partial");
  expect(finish).toHaveBeenCalledWith(expect.arrayContaining(["very-secret-value"]));
});

test("uses the process environment when an execution error has no options", async () => {
  executePreparedJestRun.mockRejectedValue(new Error("runner failed"));
  await expect(runJest("repo", [], jest.fn())).rejects.toThrow("runner failed");
  expect(finish).toHaveBeenCalledWith(expect.any(Array));
});

test("preserves failed execution results without attaching console reports", async () => {
  executePreparedJestRun.mockResolvedValue({ code: 1, stdout: "failed", stderr: "" });
  await expect(runJest("repo", [], jest.fn())).resolves.toMatchObject({
    code: 1,
    coverageDirectory: "coverage",
  });
  expect(attachJestConsoleOutput).not.toHaveBeenCalled();
});
