import { expect, jest, test } from "@jest/globals";
import { resolveTaskkillExecutable, terminateChild } from "../../../../../src/checks/general/E-1/E-1.20/terminate-child.mjs";

test("uses Node's supported child termination on Windows", () => {
  const kill = jest.fn();
  expect(terminateChild({ kill }, "win32")).toBe(true);
  expect(kill).toHaveBeenCalledWith();
});

test("falls back when the default Windows tree terminator cannot kill the child", () => {
  const kill = jest.fn();
  expect(terminateChild({ pid: 42, kill }, "win32")).toBe(true);
  expect(kill).toHaveBeenCalledWith();
});

test("uses the host defaults when platform arguments are omitted", () => {
  expect(terminateChild({ kill: jest.fn() })).toBe(true);
});

test("uses the injected Windows process-tree terminator when available", () => {
  const killTree = jest.fn();
  expect(terminateChild({ pid: 42, kill: jest.fn() }, "win32", process.kill, killTree)).toBe(true);
  expect(killTree).toHaveBeenCalledWith(42);
});

test("resolves the Windows tree terminator from the platform environment", () => {
  expect(resolveTaskkillExecutable({ SystemRoot: "C:/Windows" })).toMatch(/System32[\\/]taskkill\.exe$/iu);
  expect(resolveTaskkillExecutable({})).toBe("taskkill.exe");
});

test("falls back to terminating the child when no process group exists", () => {
  const kill = jest.fn();
  expect(terminateChild({ kill, pid: 0 }, "linux")).toBe(true);
  expect(kill).toHaveBeenCalledWith("SIGTERM");
});

test("terminates a POSIX process group and falls back when the group is unavailable", () => {
  const kill = jest.spyOn(process, "kill").mockImplementationOnce(() => {}).mockImplementationOnce(() => { throw new Error("missing"); });
  try {
    const child = { kill: jest.fn(), pid: 123 };
    expect(terminateChild(child, "linux")).toBe(true);
    expect(kill).toHaveBeenCalledWith(-123, "SIGTERM");
    expect(terminateChild(child, "linux")).toBe(true);
    expect(child.kill).toHaveBeenCalledWith("SIGTERM");
  } finally {
    kill.mockRestore();
  }
});

test("handles an invalid child safely", () => {
  expect(terminateChild(null, "linux")).toBe(false);
});

test("uses the injected process-group terminator at the adapter boundary", () => {
  const killProcess = jest.fn();
  expect(terminateChild({ pid: 7, kill: jest.fn() }, "linux", killProcess)).toBe(true);
  expect(killProcess).toHaveBeenCalledWith(-7, "SIGTERM");
});

test("reports failure when direct termination also fails", () => {
  expect(terminateChild({ pid: 0, kill: () => { throw new Error("closed"); } }, "linux")).toBe(false);
});
