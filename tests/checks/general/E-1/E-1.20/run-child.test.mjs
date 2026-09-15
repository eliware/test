import { expect, jest, test } from "@jest/globals";
import { runChild } from "../../../../../src/checks/general/E-1/E-1.20/run-child.mjs";

test("captures child output and reports process results", async () => {
  const output = [];
  await expect(runChild(process.execPath, ["-e", "process.stdout.write('ok'); process.stderr.write('err')"], {
    onStdout: (value) => output.push(`out:${value}`),
    onStderr: (value) => output.push(`err:${value}`),
  }))
    .resolves.toEqual({ code: 0, signal: null, stdout: "ok", stderr: "err" });
  expect(output).toEqual(["out:ok", "err:err"]);
});

test("uses default options when omitted", async () => {
  await expect(runChild(process.execPath, ["-e", "process.stdout.write('default')"]))
    .resolves.toEqual(expect.objectContaining({ code: 0, stdout: "default" }));
});

test("bounds output and rejects spawn errors", async () => {
  await expect(runChild(process.execPath, ["-e", "process.stdout.write('x'.repeat(101));"], { maxOutputLength: 100 }))
    .resolves.toEqual(expect.objectContaining({ stdout: expect.stringContaining("…") }));
  await expect(runChild("C:\\missing-executable", [], {})).rejects.toBeTruthy();
});

test("terminates a child after the configured period without progress", async () => {
  const timeout = jest.fn();
  const result = await runChild(process.execPath, ["-e", "setTimeout(() => {}, 30000)"], {
    progressPattern: /^progress$/m,
    progressTimeoutMs: 1_000,
    onTimeout: timeout,
  });
  expect(result).toEqual(expect.objectContaining({ timedOut: true }));
  expect(timeout).toHaveBeenCalledTimes(1);
});

test("resets the watchdog and reports progress markers", async () => {
  const progress = jest.fn();
  const result = await runChild(process.execPath, ["-e", "process.stderr.write('[eliware-test-progress] start suite\\n'); setTimeout(() => {}, 30000)"], {
    progressPattern: /start suite/,
    progressTimeoutMs: 1_000,
    onProgress: progress,
    captureStderr: (text) => text.replace(/^\[eliware-test-progress\].*\r?\n?/gmu, ""),
  });
  expect(result).toEqual(expect.objectContaining({ timedOut: true, stderr: "" }));
  expect(progress).toHaveBeenCalledWith(expect.stringContaining("start suite"));
});
