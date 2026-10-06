import { EventEmitter } from "node:events";
import { expect, jest, test } from "@jest/globals";
import { runChild } from "../../../../../src/orchestration/general/E-0.1/E-0.1.20/run-child.mjs";
import { createChildTimeoutController } from "../../../../../src/orchestration/general/E-0.1/E-0.1.20/create-child-timeout-controller.mjs";

test("safely controls timers before initialization and creates suite and progress trackers", () => {
  const termination = { onTimeout: jest.fn() };
  const suite = { start: jest.fn(), end: jest.fn(), stop: jest.fn() };
  const progress = { reset: jest.fn(), stop: jest.fn() };
  const createSuiteTracker = jest.fn(() => suite);
  const createTimeout = jest.fn(() => progress);
  const controller = createChildTimeoutController(
    { progressTimeoutMs: 5 },
    createTimeout,
    () => termination,
    createSuiteTracker,
  );

  controller.timeout.reset();
  controller.timeout.stop();
  controller.start();
  controller.suiteTimeout().start("tests/example.test.mjs");
  controller.suiteTimeout().end("tests/example.test.mjs");
  controller.timeout.reset();
  controller.timeout.stop();
  expect(createSuiteTracker).toHaveBeenCalledWith(
    { progressTimeoutMs: 5 },
    createTimeout,
    expect.any(Function),
  );
  expect(createTimeout).toHaveBeenCalledWith({ timeoutMs: 5, onTimeout: expect.any(Function) });
  expect(progress.reset).toHaveBeenCalledTimes(1);
  expect(progress.stop).toHaveBeenCalledTimes(1);
  expect(suite.stop).toHaveBeenCalledTimes(1);
  expect(suite.start).toHaveBeenCalledWith("tests/example.test.mjs");
  expect(suite.end).toHaveBeenCalledWith("tests/example.test.mjs");
  const onTimeout = createTimeout.mock.calls[0][0].onTimeout;
  onTimeout();
  expect(termination.onTimeout).toHaveBeenCalledTimes(1);
  expect(() => createChildTimeoutController({}, createTimeout, () => termination)).not.toThrow();
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

test("settles a child error after timeout begins without waiting for close", async () => {
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
    terminateChild: () => true,
  });
  fireTimeout();
  child.emit("error", new Error("child failed"));
  await expect(result).rejects.toThrow("child failed");
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
