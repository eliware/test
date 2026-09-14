import { expect, test } from "@jest/globals";
import { EventEmitter } from "node:events";
import { formatOutdatedDependencies, readOutdatedDependencies } from "../../../../src/checks/general/E-1/read-outdated-dependencies.mjs";

test("formats npm outdated records for diagnostics", () => {
  expect(formatOutdatedDependencies({ jest: { current: "1.0.0", latest: "2.0.0" } })).toEqual(["jest (1.0.0 -> 2.0.0)"]);
  expect(formatOutdatedDependencies({ alpha: {}, beta: { wanted: "3.0.0" }, gamma: { current: null, latest: null, wanted: null } })).toEqual([
    "alpha (unknown -> unknown)",
    "beta (unknown -> 3.0.0)",
    "gamma (unknown -> unknown)",
  ]);
  expect(formatOutdatedDependencies({})).toEqual([]);
  expect(formatOutdatedDependencies()).toEqual([]);
});

function childProcess() {
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  return child;
}

test("parses successful npm output and bounds stderr", async () => {
  const child = childProcess();
  const promise = readOutdatedDependencies("fixture", (executable, args, options) => {
    expect(executable).toBe(process.execPath);
    expect(args.at(-2)).toBe("outdated");
    expect(options.shell).toBe(false);
    queueMicrotask(() => {
      child.stdout.emit("data", '{"alpha":{"current":"1","latest":"2"}}');
      child.stderr.emit("data", "x".repeat(5000));
      child.emit("close", 1);
    });
    return child;
  });
  await expect(promise).resolves.toEqual({ alpha: { current: "1", latest: "2" } });
});

test("builds the non-Windows npm command", async () => {
  const child = childProcess();
  const originalPlatform = process.platform;
  Object.defineProperty(process, "platform", { configurable: true, value: "linux" });
  try {
    const promise = readOutdatedDependencies("fixture", (executable, args) => {
      expect(executable).toBe("npm");
      expect(args).toEqual(["outdated", "--json"]);
      queueMicrotask(() => { child.stdout.emit("data", "{}"); child.emit("close", 0); });
      return child;
    });
    await expect(promise).resolves.toEqual({});
  } finally {
    Object.defineProperty(process, "platform", { configurable: true, value: originalPlatform });
  }
});

test("uses the default process adapter and handles empty successful output", async () => {
  const child = childProcess();
  const originalProgramFiles = process.env.ProgramFiles;
  delete process.env.ProgramFiles;
  try {
    const promise = readOutdatedDependencies("fixture", undefined);
    await expect(promise).rejects.toBeTruthy();
  } finally {
    if (originalProgramFiles === undefined) delete process.env.ProgramFiles;
    else process.env.ProgramFiles = originalProgramFiles;
  }
  const empty = readOutdatedDependencies("fixture", () => {
    queueMicrotask(() => child.emit("close", 0));
    return child;
  });
  await expect(empty).resolves.toEqual({});
});

test("rejects process errors, empty failures, and invalid JSON", async () => {
  const errorChild = childProcess();
  const errorPromise = readOutdatedDependencies("fixture", () => {
    queueMicrotask(() => errorChild.emit("error", new Error("spawn failed")));
    return errorChild;
  });
  await expect(errorPromise).rejects.toThrow("spawn failed");

  const failedChild = childProcess();
  const failedPromise = readOutdatedDependencies("fixture", () => {
    queueMicrotask(() => failedChild.emit("close", 2));
    return failedChild;
  });
  await expect(failedPromise).rejects.toThrow("exited with 2");

  const invalidChild = childProcess();
  const invalidPromise = readOutdatedDependencies("fixture", () => {
    queueMicrotask(() => {
      invalidChild.stdout.emit("data", "not json");
      invalidChild.emit("close", 0);
    });
    return invalidChild;
  });
  await expect(invalidPromise).rejects.toThrow("invalid JSON");
});
