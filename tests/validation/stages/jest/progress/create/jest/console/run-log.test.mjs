import { beforeEach, expect, jest, test } from "@jest/globals";

const executePreparedJestRun = jest.fn();
jest.unstable_mockModule(
  "../../../../../../../../src/validation/stages/jest/execution/execute/prepared-jest-run.mjs",
  () => ({ executePreparedJestRun }),
);
const { runJestWithConsoleLog } =
  await import("../../../../../../../../src/validation/stages/jest/progress/create/jest/console/run-log.mjs");

const prepared = { options: { timeout: 100 } };

function createLog() {
  return { start: jest.fn(), append: jest.fn(), finish: jest.fn() };
}

beforeEach(() => {
  executePreparedJestRun.mockReset();
  executePreparedJestRun.mockResolvedValue({ code: 0, stdout: "passed", stderr: "" });
});

test("captures raw output and adds log redaction results", async () => {
  const outputLog = createLog();
  outputLog.finish.mockReturnValue({
    redacted: true,
    redactionKinds: ["environment secret"],
    writeError: true,
  });
  executePreparedJestRun.mockImplementation(async ({ options }) => {
    options.onRawStdout("passed");
    options.onRawStderr("diagnostic");
    return { code: 0, stdout: "passed", stderr: "" };
  });

  await expect(
    runJestWithConsoleLog(prepared, jest.fn(), outputLog, { API_TOKEN: "secret-value" }),
  ).resolves.toMatchObject({
    code: 0,
    outputRedacted: true,
    outputRedactionKinds: ["environment secret"],
    outputLogError: true,
  });
  expect(outputLog.start).toHaveBeenCalledTimes(1);
  expect(outputLog.append).toHaveBeenNthCalledWith(1, "stdout", "passed");
  expect(outputLog.append).toHaveBeenNthCalledWith(2, "stderr", "diagnostic");
  expect(outputLog.finish).toHaveBeenCalledWith(expect.arrayContaining(["secret-value"]));
});

test("finishes the log after an execution error and rethrows", async () => {
  const outputLog = createLog();
  executePreparedJestRun.mockRejectedValue(new Error("runner failed"));

  await expect(runJestWithConsoleLog(prepared, jest.fn(), outputLog)).rejects.toThrow(
    "runner failed",
  );
  expect(outputLog.finish).toHaveBeenCalledWith(expect.any(Array));
});

test("keeps the log open when timeout termination is not confirmed", async () => {
  const outputLog = createLog();
  executePreparedJestRun.mockResolvedValue({
    code: null,
    timedOut: true,
    terminationConfirmed: false,
  });

  await expect(runJestWithConsoleLog(prepared, jest.fn(), outputLog, {})).resolves.toMatchObject({
    terminationConfirmed: false,
  });
  expect(outputLog.finish).not.toHaveBeenCalled();
});
