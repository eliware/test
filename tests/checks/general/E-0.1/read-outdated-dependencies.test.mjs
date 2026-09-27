import { expect, jest, test } from "@jest/globals";
import { EventEmitter } from "node:events";
import { readOutdatedDependencies } from "../../../../src/checks/general/E-0.1/read-outdated-dependencies.mjs";

function childProcess() {
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  return child;
}

test("parses successful npm output", async () => {
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

test("terminates and rejects npm outdated output that exceeds its capture limit", async () => {
  const child = childProcess();
  child.kill = jest.fn();
  const result = readOutdatedDependencies("fixture", () => {
    queueMicrotask(() => {
      child.stdout.emit("data", "x".repeat(100_001));
      child.stdout.emit("data", "additional output after the limit");
      child.emit("close", null, "SIGTERM");
    });
    return child;
  });
  await expect(result).rejects.toThrow("output exceeded 100000 characters");
  expect(child.kill).toHaveBeenCalledWith("SIGTERM");
});

test("bounds termination when oversized output never closes", async () => {
  const child = childProcess();
  child.kill = jest.fn();
  const result = readOutdatedDependencies(
    "fixture",
    () => {
      queueMicrotask(() => child.stdout.emit("data", "x".repeat(100_001)));
      return child;
    },
    { terminationGracePeriodMs: 5 },
  );
  await expect(result).rejects.toThrow("output exceeded 100000 characters");
  expect(child.kill.mock.calls).toEqual([["SIGTERM"], ["SIGKILL"]]);
});

test("terminates the Windows npm process tree when output exceeds its limit", async () => {
  const child = childProcess();
  child.pid = 2468;
  child.kill = jest.fn();
  const killTree = jest.fn();
  const env = { SystemRoot: "C:\\Windows", npm_execpath: "C:\\node\\npm-cli.js" };
  const result = readOutdatedDependencies(
    "fixture",
    () => {
      queueMicrotask(() => child.stdout.emit("data", "x".repeat(100_001)));
      return child;
    },
    { platform: "win32", env, killTree, terminationGracePeriodMs: 5 },
  );
  await expect(result).rejects.toThrow("output exceeded 100000 characters");
  expect(killTree.mock.calls).toEqual([
    [2468, env],
    [2468, env],
  ]);
  expect(child.kill).not.toHaveBeenCalled();
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
    queueMicrotask(() => {
      child.emit("close", 0);
      child.emit("close", 0);
    });
    return child;
  });
  await expect(empty).resolves.toEqual({});
});

test("rejects child process errors and settles only once", async () => {
  const errorChild = childProcess();
  const errorPromise = readOutdatedDependencies("fixture", () => {
    queueMicrotask(() => errorChild.emit("error", new Error("spawn failed")));
    return errorChild;
  });
  await expect(errorPromise).rejects.toThrow("spawn failed");

  const errorThenClose = childProcess();
  const errorThenClosePromise = readOutdatedDependencies("fixture", () => {
    queueMicrotask(() => {
      errorThenClose.emit("error", new Error("spawn failed first"));
      errorThenClose.emit("close", 2);
    });
    return errorThenClose;
  });
  await expect(errorThenClosePromise).rejects.toThrow("spawn failed first");
});

test("redacts errors thrown synchronously while starting npm outdated", async () => {
  const env = { API_TOKEN: "private-token-value" };
  const result = readOutdatedDependencies("fixture", () => {
    throw new Error("spawn failed with private-token-value");
  }, { env });

  let error;
  try {
    await result;
  } catch (caught) {
    error = caught;
  }
  expect(error.message).toBe("spawn failed with [REDACTED]");
});
