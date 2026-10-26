import { expect, jest, test } from "@jest/globals";
import { createWindowsProcessTreeKiller } from "../../../../../../src/validation/shared/process/terminate/windows/process-tree.mjs";
import {
  createChildTerminator,
  terminateChild,
} from "../../../../../../src/validation/shared/process/terminate/child.mjs";

function createKiller(execute, state = { running: true }) {
  return createWindowsProcessTreeKiller(
    execute,
    () => state.running,
    () => !state.running,
    () => "C:/Program Files/PowerShell/7/pwsh.exe",
  );
}

test("delegates Windows termination to the tree adapter and falls back to child signaling", () => {
  const child = { pid: 42, kill: jest.fn() };
  const killTree = jest.fn();
  expect(terminateChild(child, "win32", jest.fn(), killTree)).toBe(true);
  expect(killTree).toHaveBeenCalledWith(42, process.env);
  expect(terminateChild({ kill: jest.fn() }, "win32")).toBe(false);

  const fallbackChild = { pid: 42, kill: jest.fn() };
  expect(
    terminateChild(fallbackChild, "win32", jest.fn(), () => {
      throw new Error("failed");
    }),
  ).toBe(false);
  expect(fallbackChild.kill).toHaveBeenCalledWith("SIGTERM");
});

test("uses the configured Windows tree adapter when no call-specific adapter is supplied", () => {
  const killTree = jest.fn();
  const terminate = createChildTerminator(killTree);
  expect(terminate({ pid: 24, kill: jest.fn() }, "win32")).toBe(true);
  expect(killTree).toHaveBeenCalledWith(24, process.env);
});

test("reports failures when no Windows tree terminator succeeds", () => {
  const state = { running: true };
  const execute = jest.fn(() => {
    throw new Error("process unavailable");
  });
  expect(() => createKiller(execute, state)(42, { SystemRoot: "C:/Windows" })).toThrow(
    "Windows process-tree termination failed",
  );
  expect(execute).toHaveBeenCalledTimes(3);
});

test("does not report success until the process is observed closed", () => {
  const calls = [];
  const execute = (command) => calls.push(command);
  expect(() => createKiller(execute)(42, { SystemRoot: "C:/Windows" })).toThrow("remains running");
  expect(calls).toHaveLength(2);
});

test("skips termination when the process is already closed", () => {
  const execute = jest.fn();
  const killer = createWindowsProcessTreeKiller(execute, () => false);
  killer(42, { SystemRoot: "C:/Windows" });
  expect(execute).not.toHaveBeenCalled();
});

test("confirms taskkill termination through the default process-exit waiter", () => {
  const state = { running: true };
  const execute = jest.fn(() => {
    state.running = false;
  });
  createWindowsProcessTreeKiller(execute, () => state.running)(42, {
    SystemRoot: "C:/Windows",
  });
  expect(execute).toHaveBeenCalledTimes(1);
});

test("uses injected command execution when omitted from the killer call", () => {
  const execute = jest.fn();
  const state = { running: true };
  const killTree = createKiller((...args) => {
    execute(...args);
    state.running = false;
  }, state);
  const previous = process.env.SystemRoot;
  process.env.SystemRoot = "C:/Windows";
  try {
    killTree(42);
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
