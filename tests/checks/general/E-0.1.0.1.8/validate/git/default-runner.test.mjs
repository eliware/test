import { expect, jest, test } from "@jest/globals";

const execFile = jest.fn();
const runMockGit = jest.fn(async (_command, _args) => ({ stdout: "mocked output" }));
execFile[Symbol.for("nodejs.util.promisify.custom")] = runMockGit;
jest.unstable_mockModule("node:child_process", () => ({ execFile }));
const { defaultGitRunner } =
  await import("../../../../../../src/checks/general/E-0.1.0.1.8/validate/git/default-runner.mjs");

test("runs Git through the injected mocked process adapter", async () => {
  await expect(defaultGitRunner("git", ["status"])).resolves.toEqual({
    stdout: "mocked output",
  });
  expect(runMockGit).toHaveBeenCalledWith("git", ["status"]);
});
