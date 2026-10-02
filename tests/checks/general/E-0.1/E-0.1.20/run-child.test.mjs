import { EventEmitter } from "node:events";
import { expect, jest, test } from "@jest/globals";
import { runChild } from "../../../../../src/checks/general/E-0.1/E-0.1.20/run-child.mjs";

test("spawns a child and returns captured process output", async () => {
  const output = [];
  await expect(
    runChild(process.execPath, ["-e", "process.stdout.write('ok'); process.stderr.write('err')"], {
      onStdout: (value) => output.push(`out:${value}`),
      onStderr: (value) => output.push(`err:${value}`),
    }),
  ).resolves.toEqual({ code: 0, signal: null, stdout: "ok", stderr: "err" });
  expect(output).toEqual(["out:ok", "err:err"]);
});

test("uses process defaults when options are omitted", async () => {
  await expect(
    runChild(process.execPath, ["-e", "process.stdout.write('default')"]),
  ).resolves.toEqual(expect.objectContaining({ code: 0, stdout: "default" }));
});

test("handles children without streams and ignores errors after close", async () => {
  const child = new EventEmitter();
  const result = runChild("ignored", [], { spawnProcess: () => child });
  child.emit("close", 0, null);
  child.emit("error", new Error("late child error"));
  await expect(result).resolves.toEqual({ code: 0, signal: null, stdout: "", stderr: "" });
});

test("normalizes and redacts synchronous spawn failures before process setup", async () => {
  const createProgressTimeout = jest.fn();
  const result = runChild("ignored", [], {
    env: { API_TOKEN: "private-token-value" },
    spawnProcess: () => {
      throw new Error("spawn failed with private-token-value");
    },
    createProgressTimeout,
  });
  let error;
  try {
    await result;
  } catch (caught) {
    error = caught;
  }
  expect(error.message).toBe("spawn failed with [REDACTED]");
  expect(createProgressTimeout).not.toHaveBeenCalled();
});

test("normalizes non-Error synchronous spawn failures", async () => {
  await expect(
    runChild("ignored", [], {
      spawnProcess: () => {
        throw "launch failed";
      },
    }),
  ).rejects.toThrow("launch failed");
  await expect(
    runChild("ignored", [], {
      spawnProcess: () => {
        throw new Error("");
      },
    }),
  ).rejects.toThrow("Child process could not be started.");
});

test("terminates a spawned child when progress-timeout setup fails", async () => {
  const child = Object.assign(new EventEmitter(), { kill: jest.fn() });
  const terminateChild = jest.fn(() => true);

  await expect(
    runChild("ignored", [], {
      spawnProcess: () => child,
      createProgressTimeout: () => {
        throw new Error("timeout setup failed");
      },
      terminateChild,
    }),
  ).rejects.toThrow("timeout setup failed");

  expect(terminateChild).toHaveBeenCalledWith(
    child,
    process.platform,
    process.kill,
    undefined,
    process.env,
    "SIGTERM",
  );
  expect(child.kill).not.toHaveBeenCalled();
});

test("wires progress, timeout, output, and timed-out child settlement", async () => {
  const child = Object.assign(new EventEmitter(), {
    stdout: new EventEmitter(),
    stderr: new EventEmitter(),
  });
  const reset = jest.fn();
  const onProgress = jest.fn();
  const onTimeout = jest.fn();
  const onStdout = jest.fn();
  const onStderr = jest.fn();
  let fireTimeout;
  const result = runChild("ignored", [], {
    spawnProcess: () => child,
    createProgressTimeout: ({ onTimeout: callback }) => {
      fireTimeout = callback;
      return { reset, stop: jest.fn() };
    },
    progressPattern: /progress/u,
    onProgress,
    onTimeout,
    onStdout,
    onStderr,
    terminateChild: () => true,
    terminationGraceMs: 60_000,
  });

  child.stdout.emit("data", "output");
  child.stderr.emit("data", "progress\n");
  fireTimeout();
  child.emit("close", null, "SIGTERM");
  child.stderr.emit("data", "progress after close\n");

  await expect(result).resolves.toMatchObject({
    timedOut: true,
    terminationRequested: true,
    terminationConfirmed: true,
    stdout: "output",
  });
  expect(reset).toHaveBeenCalledTimes(2);
  expect(onProgress).toHaveBeenCalledTimes(2);
  expect(onTimeout).toHaveBeenCalledTimes(1);
  expect(onStdout).toHaveBeenCalledWith("output");
  expect(onStderr).toHaveBeenCalledWith("progress\n");
});

test("terminates Jest when one suite exceeds its total runtime deadline", async () => {
  jest.useFakeTimers();
  try {
    const child = Object.assign(new EventEmitter(), {
      stdout: new EventEmitter(),
      stderr: new EventEmitter(),
    });
    const onSuiteTimeout = jest.fn();
    const result = runChild("ignored", [], {
      spawnProcess: () => child,
      progressTimeoutMs: 15_000,
      suiteTimeoutMs: 5_000,
      progressPattern: /^progress$/u,
      onProgress(text) {
        if (text === "progress") this.onSuiteStart("tests/slow.test.mjs");
      },
      onSuiteTimeout,
      terminateChild: () => true,
      terminationGraceMs: 1,
    });

    child.stderr.emit("data", "progress\n");
    child.stdout.emit("data", "test still producing output\n");
    jest.advanceTimersByTime(6_001);

    await expect(result).resolves.toMatchObject({ timedOut: true });
    expect(onSuiteTimeout).toHaveBeenCalledWith("tests/slow.test.mjs");
  } finally {
    jest.useRealTimers();
  }
});

test("settles when the process never confirms termination", async () => {
  jest.useFakeTimers();
  try {
    const child = Object.assign(new EventEmitter(), {
      stdout: new EventEmitter(),
      stderr: new EventEmitter(),
    });
    let fireTimeout;
    const result = runChild("ignored", [], {
      spawnProcess: () => child,
      createProgressTimeout: ({ onTimeout }) => {
        fireTimeout = onTimeout;
        return { reset: jest.fn(), stop: jest.fn() };
      },
      terminateChild: () => false,
      terminationGraceMs: 1,
      forceKillConfirmationMs: 1,
    });

    fireTimeout();
    jest.advanceTimersByTime(2);

    await expect(result).resolves.toMatchObject({
      code: null,
      signal: "SIGKILL",
      timedOut: true,
      terminationRequested: true,
      terminationConfirmed: false,
    });
  } finally {
    jest.useRealTimers();
  }
});
