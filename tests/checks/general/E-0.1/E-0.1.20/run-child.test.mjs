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

test("rejects failures raised during process creation", async () => {
  await expect(runChild("C:\\missing-executable", [], {})).rejects.toBeTruthy();
});

test("settles once when the child emits duplicate close and late error events", async () => {
  const child = Object.assign(new EventEmitter(), {
    stdout: new EventEmitter(),
    stderr: new EventEmitter(),
  });
  const result = runChild("ignored", [], { spawnProcess: () => child });

  child.emit("close", 0, null);
  child.emit("close", 1, null);
  child.emit("error", new Error("late error"));

  await expect(result).resolves.toMatchObject({ code: 0 });
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
