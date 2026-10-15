import { expect, jest, test } from "@jest/globals";
import { validateGitOrigin } from "../../../../src/checks/npm-published/E-0.1.10.1.3/validate-git-origin.mjs";

const packageUrl = "git+https://github.com/eliware/test.git";

test.each([
  "https://github.com/eliware/test.git",
  "git@github.com:eliware/test.git",
  "ssh://git@github.com/eliware/test.git",
])("accepts a matching GitHub remote: %s", async (remote) => {
  const runGit = jest.fn().mockResolvedValue({ stdout: `${remote}\n` });
  await expect(validateGitOrigin("repo", packageUrl, runGit)).resolves.toEqual([]);
  expect(runGit).toHaveBeenCalledWith("git", ["-C", "repo", "remote", "get-url", "origin"], {
    windowsHide: true,
    encoding: "utf8",
  });
});

test.each([
  ["not-a-url", "package.json.repository.url must identify a GitHub repository."],
  [
    "https://example.com/eliware/test.git",
    "package.json.repository.url must identify a GitHub repository.",
  ],
])("rejects repository URL %s", async (repositoryUrl, message) => {
  await expect(validateGitOrigin("repo", repositoryUrl, jest.fn())).resolves.toEqual([message]);
});

test.each([undefined, "", 12, "https://github.com/./test.git", "https://github.com/eliware/.."])(
  "rejects an invalid repository identity: %s",
  async (repositoryUrl) => {
    await expect(validateGitOrigin("repo", repositoryUrl, jest.fn())).resolves.toEqual([
      "package.json.repository.url must identify a GitHub repository.",
    ]);
  },
);

test("rejects a different live origin", async () => {
  await expect(
    validateGitOrigin("repo", packageUrl, async () => ({
      stdout: "git@github.com:eliware/other.git",
    })),
  ).resolves.toEqual(["Git origin must match package.json.repository.url."]);
});

test("reports an unavailable origin", async () => {
  await expect(
    validateGitOrigin("repo", packageUrl, async () => {
      throw new Error("no remote");
    }),
  ).resolves.toEqual(["Git origin could not be read."]);
});
