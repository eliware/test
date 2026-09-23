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
