import { expect, jest, test } from "@jest/globals";
import {
  createWindowsProcessTreeKiller,
  killWindowsProcessTree,
  resolveTaskkillExecutable,
} from "../../../../../src/checks/general/E-0.1/E-0.1.20/terminate-windows-process-tree.mjs";

test("resolves taskkill from an absolute Windows system root", () => {
  expect(resolveTaskkillExecutable({ SystemRoot: "C:/Windows" })).toMatch(
    /System32[\\/]taskkill\.exe$/iu,
  );
  expect(() => resolveTaskkillExecutable({})).toThrow("SystemRoot");
  expect(() => resolveTaskkillExecutable({ SystemRoot: "relative\\Windows" })).toThrow(
    "absolute SystemRoot",
  );
  expect(() => resolveTaskkillExecutable({ SystemRoot: "C:\\Windows\\..\\Temp" })).toThrow(
    "absolute SystemRoot",
  );
});

test("uses bounded taskkill and PowerShell process-tree fallbacks", () => {
  const calls = [];
  const execute = (command, args, options) => {
    calls.push({ command, args, options });
    if (calls.length === 1) throw new Error("taskkill unavailable");
  };
  killWindowsProcessTree(42, { SystemRoot: "C:/Windows" }, execute);
  expect(calls).toHaveLength(2);
  expect(calls[0].command).toMatch(/System32[\\/]taskkill\.exe$/iu);
  expect(calls[0].args).toEqual(["/pid", "42", "/t", "/f"]);
  expect(calls[0].options).toMatchObject({ timeout: 1_000, windowsHide: true, shell: false });
  expect(calls[1].command).toMatch(/WindowsPowerShell[\\/]v1\.0[\\/]powershell\.exe$/iu);
  expect(calls[1].args.at(-1)).toContain("Get-CimInstance Win32_Process");
  expect(calls[1].options.timeout).toBe(1_000);
  expect(calls[1].options.env.ELIWARE_TEST_PROCESS_ID).toBe("42");
});

test("reports both failures when neither Windows tree terminator succeeds", () => {
  const execute = jest.fn(() => {
    throw new Error("process unavailable");
  });
  expect(() => killWindowsProcessTree(42, { SystemRoot: "C:/Windows" }, execute)).toThrow(
    "Windows process-tree termination failed",
  );
  expect(execute).toHaveBeenCalledTimes(2);
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

test("uses injected command execution when omitted from the killer call", () => {
  const execute = jest.fn();
  const killTree = createWindowsProcessTreeKiller(execute);
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
