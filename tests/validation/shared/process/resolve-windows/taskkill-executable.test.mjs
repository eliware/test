import { expect, test } from "@jest/globals";
import { resolveTaskkillExecutable } from "../../../../../src/validation/shared/process/resolve-windows/taskkill-executable.mjs";

test("resolves taskkill from an absolute Windows system root", () => {
  expect(resolveTaskkillExecutable({ SystemRoot: "C:/Windows" })).toMatch(
    /System32[\\/]taskkill\.exe$/iu,
  );
  expect(resolveTaskkillExecutable({ WINDIR: "D:/Windows" })).toMatch(
    /D:[\\/]Windows[\\/]System32[\\/]taskkill\.exe$/iu,
  );
});

test("uses the process environment when no root is passed", () => {
  const previous = process.env.SystemRoot;
  process.env.SystemRoot = "C:/Windows";
  try {
    expect(resolveTaskkillExecutable()).toMatch(/System32[\\/]taskkill\.exe$/iu);
  } finally {
    if (previous === undefined) delete process.env.SystemRoot;
    else process.env.SystemRoot = previous;
  }
});
