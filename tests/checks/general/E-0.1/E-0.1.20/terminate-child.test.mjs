import { expect, jest, test } from "@jest/globals";
import {
  resolveTaskkillExecutable,
  killWindowsProcessTree,
  terminateChild,
} from "../../../../../src/checks/general/E-0.1/E-0.1.20/terminate-child.mjs";

test("uses Node's supported child termination on Windows", () => {
  const kill = jest.fn();
  expect(terminateChild({ kill }, "win32")).toBe(true);
  expect(kill).toHaveBeenCalledWith("SIGTERM");
});

test("bounds the taskkill wait time", () => {
  const execute = jest.fn();
  killWindowsProcessTree(42, { SystemRoot: "C:/Windows" }, execute);
  expect(execute).toHaveBeenCalledWith(
    expect.stringMatching(/System32[\\/]taskkill\.exe$/iu),
    ["/pid", "42", "/t", "/f"],
    expect.objectContaining({ timeout: 1_000, windowsHide: true, stdio: "ignore" }),
  );
});

test("uses the process environment when resolving taskkill by default", () => {
  const previous = process.env.SystemRoot;
  process.env.SystemRoot = "C:/Windows";
  const execute = jest.fn();
  try {
    killWindowsProcessTree(42, undefined, execute);
    expect(execute).toHaveBeenCalledWith(
      expect.stringMatching(/System32[\\/]taskkill\.exe$/iu),
      ["/pid", "42", "/t", "/f"],
      expect.objectContaining({ timeout: 1_000 }),
    );
  } finally {
    if (previous === undefined) delete process.env.SystemRoot;
    else process.env.SystemRoot = previous;
  }
});

test("falls back to child termination when bounded taskkill expires", () => {
  const child = { pid: 42, kill: jest.fn() };
  const killTree = jest.fn(() => { throw new Error("taskkill timed out"); });
  expect(terminateChild(child, "win32", process.kill, killTree)).toBe(true);
  expect(child.kill).toHaveBeenCalledWith("SIGTERM");
});

test("falls back when the default Windows tree terminator cannot kill the child", () => {
  const kill = jest.fn();
  expect(terminateChild({ pid: 42, kill }, "win32")).toBe(true);
  expect(kill).toHaveBeenCalledWith("SIGTERM");
});

test("reports failure when Windows direct termination fails", () => {
  expect(terminateChild({ kill: () => false }, "win32")).toBe(false);
  expect(
    terminateChild(
      {
        kill: () => {
          throw new Error("closed");
        },
      },
      "win32",
    ),
  ).toBe(false);
});

test("uses the host defaults when platform arguments are omitted", () => {
  expect(terminateChild({ kill: jest.fn() })).toBe(true);
});

test("uses the injected Windows process-tree terminator when available", () => {
  const killTree = jest.fn();
  expect(terminateChild({ pid: 42, kill: jest.fn() }, "win32", process.kill, killTree)).toBe(true);
  expect(killTree).toHaveBeenCalledWith(42, process.env);
});

test("resolves the Windows tree terminator from the platform environment", () => {
  expect(resolveTaskkillExecutable({ SystemRoot: "C:/Windows" })).toMatch(
    /System32[\\/]taskkill\.exe$/iu,
  );
  expect(() => resolveTaskkillExecutable({})).toThrow("SystemRoot");
  const originalSystemRoot = process.env.SystemRoot;
  process.env.SystemRoot = "C:/Windows";
  try {
    expect(resolveTaskkillExecutable()).toMatch(/System32[\\/]taskkill\.exe$/iu);
  } finally {
    if (originalSystemRoot === undefined) delete process.env.SystemRoot;
    else process.env.SystemRoot = originalSystemRoot;
  }
});

test("passes the effective child environment to Windows tree termination", () => {
  const killTree = jest.fn();
  const env = { SystemRoot: "D:/CustomWindows" };
  expect(terminateChild({ pid: 42, kill: jest.fn() }, "win32", process.kill, killTree, env)).toBe(
    true,
  );
  expect(killTree).toHaveBeenCalledWith(42, env);
});

test("falls back to terminating the child when no process group exists", () => {
  const kill = jest.fn();
  expect(terminateChild({ kill, pid: 0 }, "linux")).toBe(true);
  expect(kill).toHaveBeenCalledWith("SIGTERM");
});

test("terminates a POSIX process group and falls back when the group is unavailable", () => {
  const kill = jest
    .spyOn(process, "kill")
    .mockImplementationOnce(() => {})
    .mockImplementationOnce(() => {
      throw new Error("missing");
    });
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

test("uses the requested signal for process-group escalation", () => {
  const killProcess = jest.fn();
  expect(
    terminateChild({ pid: 7, kill: jest.fn() }, "linux", killProcess, undefined, {}, "SIGKILL"),
  ).toBe(true);
  expect(killProcess).toHaveBeenCalledWith(-7, "SIGKILL");
});

test("reports failure when direct termination also fails", () => {
  expect(
    terminateChild(
      {
        pid: 0,
        kill: () => {
          throw new Error("closed");
        },
      },
      "linux",
    ),
  ).toBe(false);
});
