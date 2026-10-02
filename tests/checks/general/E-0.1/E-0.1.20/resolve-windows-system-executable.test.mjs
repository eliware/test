import { expect, test } from "@jest/globals";
import { resolveWindowsSystemExecutable } from "../../../../../src/checks/general/E-0.1/E-0.1.20/resolve-windows-system-executable.mjs";

test("resolves executable paths from absolute drive and UNC roots", () => {
  expect(
    resolveWindowsSystemExecutable({ SystemRoot: "C:/Windows" }, "System32", "taskkill.exe"),
  ).toMatch(/System32[\\/]taskkill\.exe$/iu);
  expect(
    resolveWindowsSystemExecutable({ WINDIR: "D:/Windows" }, "System32", "taskkill.exe"),
  ).toMatch(/D:[\\/]Windows[\\/]System32[\\/]taskkill\.exe$/iu);
  expect(
    resolveWindowsSystemExecutable({ SystemRoot: "\\\\server\\share\\Windows" }, "System32"),
  ).toMatch(/System32$/iu);
});

test.each(["relative\\Windows", "C:\\Windows\\..\\Temp", "\\\\?\\C:\\Windows", "C:\\Windows\\."])(
  "rejects unsafe system root %s",
  (SystemRoot) =>
    expect(() => resolveWindowsSystemExecutable({ SystemRoot }, "System32")).toThrow(
      "absolute SystemRoot",
    ),
);

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
