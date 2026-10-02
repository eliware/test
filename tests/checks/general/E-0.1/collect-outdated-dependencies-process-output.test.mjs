import { afterEach, expect, jest, test } from "@jest/globals";
import { EventEmitter } from "node:events";
import { collectOutdatedDependenciesProcessOutput } from "../../../../src/checks/general/E-0.1/collect-outdated-dependencies-process-output.mjs";

afterEach(() => jest.useRealTimers());

function childProcess() {
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  return child;
}

function options(overrides = {}) {
  return {
    maxStdoutLength: 5,
    maxStderrLength: 5,
    terminationGracePeriodMs: 20,
    terminateProcess: jest.fn(),
    platform: "linux",
    killProcess: jest.fn(),
    killTree: jest.fn(),
    env: {},
    ...overrides,
  };
}

test("collects bounded stdout and stderr and settles on the first close", async () => {
  const child = childProcess();
  const result = collectOutdatedDependenciesProcessOutput(child, options());
  child.stdout.emit("data", Buffer.from("ok"));
  child.stderr.emit("data", Buffer.from("abcdef"));
  child.emit("close", 0);
  child.emit("close", 1);
  child.stdout.emit("data", Buffer.from("late"));
  await expect(result).resolves.toEqual({ stdout: "ok", stderr: "bcdef", code: 0 });
});

test("rejects overflow after terminating the child", async () => {
  const child = childProcess();
  const deps = options();
  const result = collectOutdatedDependenciesProcessOutput(child, deps);
  child.stdout.emit("data", Buffer.from("123456"));
  child.stdout.emit("data", Buffer.from("later"));
  expect(deps.terminateProcess).toHaveBeenCalledWith(
    child,
    "linux",
    deps.killProcess,
    deps.killTree,
    {},
    "SIGTERM",
  );
  child.emit("close", null);
  await expect(result).rejects.toThrow("output exceeded 5 characters");
});

test("escalates overflow termination and rejects if the process does not close", async () => {
  jest.useFakeTimers();
  const child = childProcess();
  const deps = options();
  const result = collectOutdatedDependenciesProcessOutput(child, deps);
  child.stdout.emit("data", Buffer.from("123456"));
  const rejection = expect(result).rejects.toThrow("output exceeded 5 characters");
  await jest.advanceTimersByTimeAsync(20);
  await rejection;
  expect(deps.terminateProcess.mock.calls.map((call) => call.at(-1))).toEqual([
    "SIGTERM",
    "SIGKILL",
  ]);
});

test("passes Windows process-tree dependencies on overflow and ignores later events", async () => {
  const child = childProcess();
  child.pid = 42;
  const env = { SystemRoot: "C:\\Windows" };
  const deps = options({ platform: "win32", env });
  const result = collectOutdatedDependenciesProcessOutput(child, deps);
  child.stdout.emit("data", Buffer.from("123456"));
  child.emit("close", null);
  child.emit("error", new Error("late error"));
  await expect(result).rejects.toThrow("output exceeded 5 characters");
  expect(deps.terminateProcess).toHaveBeenCalledWith(
    child,
    "win32",
    deps.killProcess,
    deps.killTree,
    env,
    "SIGTERM",
  );
});

test("rejects child process errors and ignores later close events", async () => {
  const child = childProcess();
  const result = collectOutdatedDependenciesProcessOutput(child, options());
  child.emit("error", new Error("spawn failed"));
  child.emit("close", 0);
  await expect(result).rejects.toThrow("spawn failed");
});

test("terminates the child and rejects when either captured stream errors", async () => {
  for (const streamName of ["stdout", "stderr"]) {
    const child = childProcess();
    const deps = options();
    const result = collectOutdatedDependenciesProcessOutput(child, deps);
    child[streamName].emit("error", new Error(`${streamName} failed`));
    await expect(result).rejects.toThrow(`${streamName} failed`);
    expect(deps.terminateProcess).toHaveBeenCalledWith(
      child,
      "linux",
      deps.killProcess,
      deps.killTree,
      {},
      "SIGTERM",
    );
    child[streamName === "stdout" ? "stderr" : "stdout"].emit("error", new Error("late"));
  }
});
