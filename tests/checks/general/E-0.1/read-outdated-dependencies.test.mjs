import { expect, jest, test } from "@jest/globals";
import { EventEmitter } from "node:events";

const spawn = jest.fn();
const childProcessModule = await import("node:child_process");
jest.unstable_mockModule("node:child_process", () => ({ ...childProcessModule, spawn }));
const { readOutdatedDependencies } =
  await import("../../../../src/checks/general/E-0.1/read-outdated-dependencies.mjs");

function childProcess() {
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  return child;
}

test("spawns npm outdated and parses its process output", async () => {
  const child = childProcess();
  const result = readOutdatedDependencies("fixture", {
    spawnProcess: (executable, args, options) => {
      expect(executable).toBe(process.execPath);
      expect(args.at(-2)).toBe("outdated");
      expect(options.shell).toBe(false);
      queueMicrotask(() => {
        child.stdout.emit("data", '{"alpha":{"current":"1","latest":"2"}}');
        child.stderr.emit("data", "x".repeat(5000));
        child.emit("close", 1);
      });
      return child;
    },
  });
  await expect(result).resolves.toEqual({ alpha: { current: "1", latest: "2" } });
});

test("uses the default child-process adapter when options are omitted", async () => {
  const child = childProcess();
  spawn.mockImplementationOnce((_executable, _args, _options) => {
    queueMicrotask(() => {
      child.stdout.emit("data", "{}");
      child.emit("close", 0);
    });
    return child;
  });

  await expect(readOutdatedDependencies("fixture")).resolves.toEqual({});
  expect(spawn).toHaveBeenCalledWith(
    process.execPath,
    expect.any(Array),
    expect.objectContaining({ cwd: "fixture", shell: false }),
  );
});

test("redacts errors thrown synchronously while starting npm outdated", async () => {
  const env = { API_TOKEN: "private-token-value" };
  const result = readOutdatedDependencies("fixture", {
    spawnProcess: () => {
      throw new Error("spawn failed with private-token-value");
    },
    env,
  });
  await expect(result).rejects.toThrow("spawn failed with [REDACTED]");
});

test("redacts asynchronous process errors", async () => {
  const child = childProcess();
  const env = { API_TOKEN: "private-token-value" };
  const result = readOutdatedDependencies("fixture", {
    spawnProcess: () => {
      queueMicrotask(() => child.emit("error", new Error("spawn failed with private-token-value")));
      return child;
    },
    env,
  });
  await expect(result).rejects.toThrow("spawn failed with [REDACTED]");
});

test("parses an empty report from the injected process adapter", async () => {
  const child = childProcess();
  const result = readOutdatedDependencies("fixture", {
    spawnProcess: () => {
      queueMicrotask(() => {
        child.stdout.emit("data", "{}");
        child.emit("close", 0);
      });
      return child;
    },
  });
  await expect(result).resolves.toEqual({});
});
