import { expect, test } from "@jest/globals";
import { resolveWindowsSystemExecutable } from "../../../../../src/checks/general/E-0.1/E-0.1.20/resolve-windows-system-executable.mjs";

test("resolves executable paths from absolute local drive roots", () => {
  expect(
    resolveWindowsSystemExecutable({ SystemRoot: "C:/Windows" }, "System32", "taskkill.exe"),
  ).toMatch(/System32[\\/]taskkill\.exe$/iu);
  expect(
    resolveWindowsSystemExecutable({ WINDIR: "D:/Windows" }, "System32", "taskkill.exe"),
  ).toMatch(/D:[\\/]Windows[\\/]System32[\\/]taskkill\.exe$/iu);
});

test.each([
  "relative\\Windows",
  "C:\\Windows\\..\\Temp",
  "\\\\?\\C:\\Windows",
  "\\\\server\\share\\Windows",
  "C:\\Windows\\.",
])("rejects unsafe system root %s", (SystemRoot) => {
  const previousSystemRoot = process.env.SystemRoot;
  const previousWindir = process.env.WINDIR;
  delete process.env.SystemRoot;
  delete process.env.WINDIR;
  try {
    expect(() => resolveWindowsSystemExecutable({ SystemRoot }, "System32")).toThrow(
      "absolute SystemRoot",
    );
  } finally {
    if (previousSystemRoot === undefined) delete process.env.SystemRoot;
    else process.env.SystemRoot = previousSystemRoot;
    if (previousWindir === undefined) delete process.env.WINDIR;
    else process.env.WINDIR = previousWindir;
  }
});

test("uses the process environment when no root is passed", () => {
  const previous = process.env.SystemRoot;
  process.env.SystemRoot = "C:/Windows";
  try {
    expect(resolveWindowsSystemExecutable(undefined, "System32", "taskkill.exe")).toMatch(
      /System32[\\/]taskkill\.exe$/iu,
    );
  } finally {
    if (previous === undefined) delete process.env.SystemRoot;
    else process.env.SystemRoot = previous;
  }
});

test("ignores non-string roots and falls back to the process environment", () => {
  const previous = process.env.SystemRoot;
  process.env.SystemRoot = "C:/Windows";
  try {
    expect(resolveWindowsSystemExecutable({ SystemRoot: 42 }, "System32", "taskkill.exe")).toMatch(
      /System32[\\/]taskkill\.exe$/iu,
    );
  } finally {
    if (previous === undefined) delete process.env.SystemRoot;
    else process.env.SystemRoot = previous;
  }
});

test("falls back from an invalid supplied root to a valid process root", () => {
  const previous = process.env.SystemRoot;
  process.env.SystemRoot = "C:/Windows";
  try {
    expect(resolveWindowsSystemExecutable({ SystemRoot: "relative/Windows" }, "System32")).toMatch(
      /System32$/iu,
    );
  } finally {
    if (previous === undefined) delete process.env.SystemRoot;
    else process.env.SystemRoot = previous;
  }
});

test("rejects non-string roots when process defaults are unavailable", () => {
  const previousSystemRoot = process.env.SystemRoot;
  const previousWindir = process.env.WINDIR;
  delete process.env.SystemRoot;
  delete process.env.WINDIR;
  try {
    expect(() => resolveWindowsSystemExecutable({ SystemRoot: 42 }, "System32")).toThrow(
      "absolute SystemRoot",
    );
  } finally {
    if (previousSystemRoot === undefined) delete process.env.SystemRoot;
    else process.env.SystemRoot = previousSystemRoot;
    if (previousWindir === undefined) delete process.env.WINDIR;
    else process.env.WINDIR = previousWindir;
  }
});
