import { expect, test } from "@jest/globals";
import { resolveGitExecutable } from "../../../../../src/checks/general/E-1/E-1.22/resolve-git-executable.mjs";

test("resolves the platform Git executable", () => {
  expect(resolveGitExecutable({ platform: "win32" })).toBe("git.exe");
  expect(resolveGitExecutable({ platform: "linux" })).toBe("git");
  expect(resolveGitExecutable()).toMatch(/git/iu);
});
