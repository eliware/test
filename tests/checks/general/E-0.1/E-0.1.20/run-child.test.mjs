import { EventEmitter } from "node:events";
import { expect, jest, test } from "@jest/globals";
import { runChild } from "../../../../../src/checks/general/E-0.1/E-0.1.20/run-child.mjs";

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

test("redacts a configured credential split across stderr chunks", async () => {
  const child = Object.assign(new EventEmitter(), { stdout: new EventEmitter(), stderr: new EventEmitter() });
  const stderr = [];
  const result = runChild("ignored", [], {
    spawnProcess: () => child,
    env: { SERVICE_TOKEN: "opaque-value-123" },
    onStderr: (text) => stderr.push(text),
  });
  child.stderr.emit("data", Buffer.from("prefix opaque-value-"));
  child.stderr.emit("data", Buffer.from("123 suffix"));
  child.emit("close", 0, null);
  await expect(result).resolves.toMatchObject({ stderr: "prefix [REDACTED] suffix" });
  expect(stderr.join("")).not.toContain("opaque-value-123");
  expect(stderr.join("")).not.toContain("opaque-value-");
});

test("uses default options when omitted", async () => {
  await expect(
    runChild(process.execPath, ["-e", "process.stdout.write('default')"]),
  ).resolves.toEqual(expect.objectContaining({ code: 0, stdout: "default" }));
});

test("rejects spawn errors", async () => {
  await expect(runChild("C:\\missing-executable", [], {})).rejects.toBeTruthy();
});

test("ignores duplicate close, late error, progress, and watchdog events", async () => {
  const child = Object.assign(new EventEmitter(), { stdout: new EventEmitter(), stderr: new EventEmitter() });
  const reset = jest.fn();
  let onTimeout;
  const result = runChild("ignored", [], {
    spawnProcess: () => child,
    progressPattern: /late/u,
    createProgressTimeout: (options) => {
      onTimeout = options.onTimeout;
      return { reset, stop: jest.fn() };
    },
  });
  child.emit("close", 0, null);
  child.emit("close", 1, null);
  child.emit("error", new Error("late error"));
  child.stderr.emit("data", "late\n");
  onTimeout();
  await expect(result).resolves.toMatchObject({ code: 0 });
  expect(reset).toHaveBeenCalledTimes(1);
});

test("resets progress and confirms a child that closes after timeout", async () => {
  const child = Object.assign(new EventEmitter(), {
    stdout: new EventEmitter(),
    stderr: new EventEmitter(),
  });
  let onTimeout;
  const result = runChild("ignored", [], {
    spawnProcess: () => child,
    progressPattern: /started/u,
    createProgressTimeout: (options) => {
      onTimeout = options.onTimeout;
      return { reset: jest.fn(), stop: jest.fn() };
    },
  });
  child.stderr.emit("data", "started\n");
  onTimeout();
  child.emit("close", null, "SIGTERM");
  await expect(result).resolves.toMatchObject({
    timedOut: true,
    terminationRequested: true,
    terminationConfirmed: true,
  });
});

test("reports a timeout when the child never confirms termination", async () => {
  const child = Object.assign(new EventEmitter(), {
    stdout: new EventEmitter(),
    stderr: new EventEmitter(),
  });
  let onTimeout;
  const result = runChild("ignored", [], {
    spawnProcess: () => child,
    terminationGraceMs: 1,
    forceKillConfirmationMs: 1,
    createProgressTimeout: (options) => {
      onTimeout = options.onTimeout;
      return { reset: jest.fn(), stop: jest.fn() };
    },
    terminateChild: () => true,
  });
  onTimeout();
  await expect(result).resolves.toMatchObject({
    timedOut: true,
    terminationRequested: true,
    terminationConfirmed: false,
  });
});

test("settles boundedly when timeout and termination callbacks throw", async () => {
  const child = Object.assign(new EventEmitter(), {
    stdout: new EventEmitter(),
    stderr: new EventEmitter(),
  });
  let onTimeout;
  const result = runChild("ignored", [], {
    spawnProcess: () => child,
    terminationGraceMs: 1,
    forceKillConfirmationMs: 1,
    onTimeout: () => { throw new Error("timeout callback failed"); },
    createProgressTimeout: (options) => {
      onTimeout = options.onTimeout;
      return { reset: jest.fn(), stop: jest.fn() };
    },
    terminateChild: () => { throw new Error("termination failed"); },
  });
  onTimeout();
  await expect(result).resolves.toMatchObject({
    timedOut: true,
    terminationRequested: true,
    terminationConfirmed: false,
  });
});
