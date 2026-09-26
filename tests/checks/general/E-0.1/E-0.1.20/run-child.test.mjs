import { EventEmitter } from "node:events";
import { expect, jest, test } from "@jest/globals";
import { runChild } from "../../../../../src/checks/general/E-0.1/E-0.1.20/run-child.mjs";

function createChild() {
  return Object.assign(new EventEmitter(), {
    stdout: new EventEmitter(),
    stderr: new EventEmitter(),
  });
}

test("captures child output and reports process results", async () => {
  const output = [];
  await expect(
    runChild(process.execPath, ["-e", "process.stdout.write('ok'); process.stderr.write('err')"], {
      onStdout: (value) => output.push(`out:${value}`),
      onStderr: (value) => output.push(`err:${value}`),
    }),
  ).resolves.toEqual({ code: 0, signal: null, stdout: "ok", stderr: "err" });
  expect(output).toEqual(["out:ok", "err:err"]);
});

test("redacts stderr before progress and output callbacks", async () => {
  const progress = jest.fn();
  const stderr = jest.fn();
  const result = await runChild(
    process.execPath,
    ["-e", "process.stderr.write(`[eliware-test-progress] ${process.env.SERVICE_TOKEN}`)"],
    {
      env: { SERVICE_TOKEN: "x" },
      progressPattern: /eliware-test-progress/u,
      onProgress: progress,
      onStderr: stderr,
    },
  );
  expect(result.stderr).not.toContain("x");
  expect(progress.mock.calls.flat().join(" ")).not.toContain("x");
  expect(stderr.mock.calls.flat().join(" ")).not.toContain("x");
});

test("uses default options when omitted", async () => {
  await expect(
    runChild(process.execPath, ["-e", "process.stdout.write('default')"]),
  ).resolves.toEqual(expect.objectContaining({ code: 0, stdout: "default" }));
});

test("rejects spawn errors", async () => {
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
  const result = await runChild(
    process.execPath,
    [
      "-e",
      "process.stderr.write('[eliware-test-progress] start suite\\n'); setTimeout(() => {}, 30000)",
    ],
    {
      progressPattern: /start suite/,
      progressTimeoutMs: 1_000,
      onProgress: progress,
      captureStderr: (text) => text.replace(/^\[eliware-test-progress\].*\r?\n?/gmu, ""),
    },
  );
  expect(result).toEqual(expect.objectContaining({ timedOut: true, stderr: "" }));
  expect(progress).toHaveBeenCalledWith(expect.stringContaining("start suite"));
});

test("reports an unconfirmed failure when a child does not close after SIGKILL", async () => {
  const child = createChild();
  child.kill = jest.fn(() => true);
  let onTimeout;
  const result = runChild("ignored", [], {
    spawnProcess: () => child,
    terminationPlatform: "win32",
    terminationGraceMs: 1,
    forceKillConfirmationMs: 1,
    createProgressTimeout: (options) => {
      onTimeout = options.onTimeout;
      return { reset: jest.fn(), stop: jest.fn() };
    },
  });
  onTimeout();
  await expect(result).resolves.toMatchObject({
    timedOut: true,
    terminationRequested: true,
    terminationConfirmed: false,
    signal: "SIGKILL",
  });
});

test("does not replace a close result when termination callbacks arrive late", async () => {
  const child = createChild();
  let onTimeout;
  const signals = [];
  const result = runChild("ignored", [], {
    spawnProcess: () => child,
    terminationGraceMs: 1,
    forceKillConfirmationMs: 1,
    createProgressTimeout: (options) => {
      onTimeout = options.onTimeout;
      return { reset: jest.fn(), stop: jest.fn() };
    },
    terminateChild: (_child, _platform, _killProcess, _killTree, _env, signal) => {
      signals.push(signal);
      if (signal === "SIGTERM") child.emit("close", 0, null);
      return true;
    },
  });
  onTimeout();
  await expect(result).resolves.toMatchObject({ code: 0, timedOut: true });
  await new Promise((resolve) => setTimeout(resolve, 5));
  expect(signals).toEqual(["SIGTERM", "SIGKILL"]);
});

test("ignores an error emitted after the child has closed", async () => {
  const child = createChild();
  const result = runChild("ignored", [], { spawnProcess: () => child });
  child.emit("close", 0, null);
  child.emit("error", new Error("late spawn error"));
  await expect(result).resolves.toMatchObject({ code: 0, signal: null });
});

test("does not timeout after the child has already closed", async () => {
  const child = createChild();
  const onTimeout = jest.fn();
  const result = runChild("ignored", [], {
    spawnProcess: () => child,
    progressTimeoutMs: 5,
    onTimeout,
  });
  child.emit("close", 0, null);
  await new Promise((resolve) => setTimeout(resolve, 15));
  await expect(result).resolves.toMatchObject({ code: 0 });
  expect(onTimeout).not.toHaveBeenCalled();
});

test("guards a watchdog callback that arrives after close", async () => {
  const child = createChild();
  let onTimeout;
  const timeout = { reset: jest.fn(), stop: jest.fn(), wasTriggered: () => false };
  const result = runChild("ignored", [], {
    spawnProcess: () => child,
    createProgressTimeout: (options) => {
      onTimeout = options.onTimeout;
      return timeout;
    },
  });
  child.emit("close", 0, null);
  onTimeout();
  await expect(result).resolves.toMatchObject({ code: 0 });
});

test("clears the escalation timer when timeout is followed by close", async () => {
  const child = createChild();
  let onTimeout;
  const result = runChild("ignored", [], {
    spawnProcess: () => child,
    createProgressTimeout: (options) => {
      onTimeout = options.onTimeout;
      return { reset: jest.fn(), stop: jest.fn() };
    },
  });
  onTimeout();
  child.emit("close", null, "SIGTERM");
  await expect(result).resolves.toMatchObject({ timedOut: true, signal: "SIGTERM" });
});

test("clears the escalation timer when timeout is followed by an error", async () => {
  const child = createChild();
  let onTimeout;
  const result = runChild("ignored", [], {
    spawnProcess: () => child,
    createProgressTimeout: (options) => {
      onTimeout = options.onTimeout;
      return { reset: jest.fn(), stop: jest.fn() };
    },
  });
  onTimeout();
  child.emit("error", new Error("late failure"));
  await expect(result).rejects.toThrow("late failure");
});
