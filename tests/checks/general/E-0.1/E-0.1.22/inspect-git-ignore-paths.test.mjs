import { expect, jest, test } from "@jest/globals";
import { gitIgnores, inspectGitIgnorePaths } from "../../../../../src/checks/general/E-0.1/E-0.1.22/inspect-git-ignore-paths.mjs";

test("checks multiple paths in one Git process and returns partially ignored paths", async () => {
  const runGit = jest.fn(async () => { throw { code: 1, stdout: "node_modules/eliware-test\ncoverage/index.html\n" }; });
  const ignored = await inspectGitIgnorePaths("C:/repo", ["node_modules/eliware-test", "dist/index.js", "coverage/index.html"], runGit, () => "git.exe");
  expect(ignored).toEqual(new Set(["node_modules/eliware-test", "coverage/index.html"]));
  expect(runGit).toHaveBeenCalledTimes(1);
  expect(runGit).toHaveBeenCalledWith("git.exe", [
    "-C", "C:/repo", "check-ignore", "--no-index", "--", "node_modules/eliware-test", "dist/index.js", "coverage/index.html",
  ], { windowsHide: true });
});

test("reads partial match output from the real Git command", async () => {
  await expect(
    inspectGitIgnorePaths(process.cwd(), ["node_modules/eliware-test", "AGENTS.md"]),
  ).resolves.toEqual(new Set(["node_modules/eliware-test"]));
});

test("normalizes Windows separators returned by Git before matching", async () => {
  const ignored = await inspectGitIgnorePaths(
    "C:/repo",
    ["node_modules/eliware-test"],
    async () => ({ stdout: "node_modules\\eliware-test\r\n" }),
    () => "git.exe",
  );
  expect(ignored).toEqual(new Set(["node_modules/eliware-test"]));
});

test("returns an empty set without starting Git when no paths need inspection", async () => {
  const runGit = jest.fn();
  await expect(inspectGitIgnorePaths("C:/repo", [], runGit)).resolves.toEqual(new Set());
  expect(runGit).not.toHaveBeenCalled();
});

test("fails closed for unexpected Git errors and treats code one as ordinary non-matches", async () => {
  await expect(inspectGitIgnorePaths("C:/repo", ["file"], async () => { throw { code: 1 }; })).resolves.toEqual(new Set());
  await expect(inspectGitIgnorePaths("C:/repo", ["file"], async () => { throw { code: 2 }; })).resolves.toBeNull();
});

test("provides a single-path adapter for callers needing a boolean result", async () => {
  await expect(gitIgnores("C:/repo", "folder\\file", async (_command, args) => ({ stdout: `${args.at(-1)}\n` }), () => "git.exe")).resolves.toBe(true);
  await expect(gitIgnores("C:/repo", "file", async () => { throw { code: 1 }; }, () => "git.exe")).resolves.toBe(false);
  await expect(gitIgnores("C:/repo", "file", async () => { throw { code: 2 }; }, () => "git.exe")).resolves.toBeNull();
});
