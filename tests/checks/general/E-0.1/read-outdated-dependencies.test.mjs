import { expect, test } from "@jest/globals";
import { EventEmitter } from "node:events";
import { readOutdatedDependencies } from "../../../../src/checks/general/E-0.1/read-outdated-dependencies.mjs";

function childProcess() {
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  return child;
}

test("spawns npm outdated and parses its process output", async () => {
  const child = childProcess();
  const result = readOutdatedDependencies("fixture", (executable, args, options) => {
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
  await expect(result).resolves.toEqual({ alpha: { current: "1", latest: "2" } });
});

test("redacts errors thrown synchronously while starting npm outdated", async () => {
  const env = { API_TOKEN: "private-token-value" };
  const result = readOutdatedDependencies("fixture", () => {
    throw new Error("spawn failed with private-token-value");
  }, { env });
  await expect(result).rejects.toThrow("spawn failed with [REDACTED]");
});

test("redacts asynchronous process errors", async () => {
  const child = childProcess();
  const env = { API_TOKEN: "private-token-value" };
  const result = readOutdatedDependencies("fixture", () => {
    queueMicrotask(() => child.emit("error", new Error("spawn failed with private-token-value")));
    return child;
  }, { env });
  await expect(result).rejects.toThrow("spawn failed with [REDACTED]");
});

test("uses the default spawn adapter", async () => {
  const result = readOutdatedDependencies(process.cwd(), undefined, {
    env: { ...process.env, npm_execpath: "missing-npm-cli-for-focused-test.mjs" },
  });
  await expect(result).resolves.toEqual({});
});
