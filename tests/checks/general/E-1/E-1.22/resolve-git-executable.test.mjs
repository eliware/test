import { expect, test } from "@jest/globals";
import { resolveGitExecutable } from "../../../../../src/checks/general/E-1/E-1.22/resolve-git-executable.mjs";

test("resolves the platform Git executable", () => {
  expect(resolveGitExecutable({ platform: "win32", env: {}, exists: () => false })).toBe("git.exe");
  expect(resolveGitExecutable({ platform: "linux" })).toBe("git");
  expect(resolveGitExecutable()).toMatch(/git/iu);
});

test("finds a native Git installation outside PATH on Windows", () => {
  const expected = "C:\\Program Files\\Git\\cmd\\git.exe";
  const resolved = resolveGitExecutable({
    platform: "win32",
    env: { ProgramFiles: "C:\\Program Files" },
    exists: (candidate) => candidate === expected,
  });
  expect(resolved).toBe(expected);
});

test.each([
  [{ Path: "C:\\Git\\cmd" }, "C:\\Git\\cmd\\git.exe"],
  [{ PATH: "C:\\Git\\cmd" }, "C:\\Git\\cmd\\git.exe"],
  [{ "ProgramFiles(x86)": "C:\\Program Files (x86)" }, "C:\\Program Files (x86)\\Git\\cmd\\git.exe"],
  [{ LOCALAPPDATA: "C:\\Temp\\Local" }, "C:\\Temp\\Local\\Programs\\Git\\cmd\\git.exe"],
])("searches each Windows Git location independently", (env, expected) => {
  expect(resolveGitExecutable({
    platform: "win32",
    env,
    exists: (candidate) => candidate === expected,
  })).toBe(expected);
});

test("uses default environment and filesystem checks for simulated Windows", () => {
  expect(resolveGitExecutable({ platform: "win32", exists: () => false })).toBe("git.exe");
  expect(resolveGitExecutable({ platform: "win32", env: { Path: "C:\\__missing_git_directory__" } })).toBe("git.exe");
});
