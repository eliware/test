import { expect, jest, test } from "@jest/globals";
import {
  createWindowsProcessTreeKiller,
  resolveTaskkillExecutable,
} from "../../../../../src/checks/general/E-0.1/E-0.1.20/terminate-windows-process-tree.mjs";

function createKiller(execute, state = { running: true }) {
  return createWindowsProcessTreeKiller(
    execute,
    () => state.running,
    () => !state.running,
  );
}

function expectInvalidSystemRoot(env) {
  const previousSystemRoot = process.env.SystemRoot;
  const previousWindir = process.env.WINDIR;
  delete process.env.SystemRoot;
  delete process.env.WINDIR;
  try {
    expect(() => resolveTaskkillExecutable(env)).toThrow("absolute SystemRoot");
  } finally {
    if (previousSystemRoot === undefined) delete process.env.SystemRoot;
    else process.env.SystemRoot = previousSystemRoot;
    if (previousWindir === undefined) delete process.env.WINDIR;
    else process.env.WINDIR = previousWindir;
  }
}

test("resolves taskkill from an absolute Windows system root", () => {
  expect(resolveTaskkillExecutable({ SystemRoot: "C:/Windows" })).toMatch(
    /System32[\\/]taskkill\.exe$/iu,
  );
  expect(resolveTaskkillExecutable({ WINDIR: "D:/Windows" })).toMatch(
    /System32[\\/]taskkill\.exe$/iu,
  );
  expectInvalidSystemRoot({ SystemRoot: "relative\\Windows" });
  expectInvalidSystemRoot({ SystemRoot: "C:\\Windows\\..\\Temp" });
  expectInvalidSystemRoot({ SystemRoot: "\\\\server\\share\\Windows" });
  expectInvalidSystemRoot({ SystemRoot: "\\\\?\\C:\\Windows" });
  expectInvalidSystemRoot({ SystemRoot: "C:\\Windows\\." });
});

test("uses bounded taskkill and PowerShell process-tree fallbacks", () => {
  const calls = [];
  const state = { running: true };
  const execute = (command, args, options) => {
    calls.push({ command, args, options });
    if (calls.length === 1) throw new Error("taskkill unavailable");
    state.running = false;
  };
  createKiller(execute, state)(42, { SystemRoot: "C:/Windows" });
  expect(calls).toHaveLength(2);
  expect(calls[0].command).toMatch(/System32[\\/]taskkill\.exe$/iu);
  expect(calls[0].args).toEqual(["/pid", "42", "/t", "/f"]);
  expect(calls[0].options).toMatchObject({ timeout: 1_000, windowsHide: true, shell: false });
  expect(calls[1].command).toMatch(/WindowsPowerShell[\\/]v1\.0[\\/]powershell\.exe$/iu);
  expect(calls[1].args.at(-1)).toContain("Get-CimInstance Win32_Process");
  expect(calls[1].options.timeout).toBe(1_000);
  expect(calls[1].options.env.ELIWARE_TEST_PROCESS_ID).toBe("42");
});

test("falls back to PowerShell Core when Windows PowerShell is unavailable", () => {
  const calls = [];
  const state = { running: true };
  const execute = (command, args) => {
    calls.push(command);
    if (calls.length < 3) throw new Error("command unavailable");
    state.running = false;
    expect(args).toContain("-NonInteractive");
  };
  createKiller(execute, state)(42, { SystemRoot: "C:/Windows" });
  expect(calls).toHaveLength(3);
  expect(calls[2]).toBe("pwsh.exe");
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

test("uses the process environment when resolving the system root by default", () => {
  const previous = process.env.SystemRoot;
  process.env.SystemRoot = "C:/Windows";
  try {
    expect(resolveTaskkillExecutable()).toMatch(/System32[\\/]taskkill\.exe$/iu);
  } finally {
    if (previous === undefined) delete process.env.SystemRoot;
    else process.env.SystemRoot = previous;
  }
});

test("rejects a missing system root when neither supplied nor process environment has one", () => {
  const previousSystemRoot = process.env.SystemRoot;
  const previousWindir = process.env.WINDIR;
  delete process.env.SystemRoot;
  delete process.env.WINDIR;
  try {
    expect(() => resolveTaskkillExecutable({ SystemRoot: 42, WINDIR: "" })).toThrow(
      "absolute SystemRoot",
    );
  } finally {
    if (previousSystemRoot === undefined) delete process.env.SystemRoot;
    else process.env.SystemRoot = previousSystemRoot;
    if (previousWindir === undefined) delete process.env.WINDIR;
    else process.env.WINDIR = previousWindir;
  }
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
