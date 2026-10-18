import { expect, jest, test } from "@jest/globals";
import { readNestedGitignorePaths } from "../../../../../../../src/checks/general/E-0.1.0.1.8/validate/git/ignore/read-nested-gitignore-paths.mjs";

test("reads tracked, untracked, and ignored nested paths", async () => {
  const runGit = jest
    .fn()
    .mockResolvedValueOnce({ stdout: Buffer.from("docs/.gitignore\0") })
    .mockResolvedValueOnce({ stdout: Buffer.from("examples/.gitignore\0") })
    .mockResolvedValueOnce({ stdout: Buffer.from("build/.gitignore\0") });
  await expect(readNestedGitignorePaths("repo", runGit)).resolves.toEqual({
    paths: ["docs/.gitignore", "examples/.gitignore", "build/.gitignore"],
  });
  expect(runGit).toHaveBeenCalledTimes(3);
});

test("reports Git command and output parsing failures", async () => {
  await expect(
    readNestedGitignorePaths("repo", async () => {
      throw new Error("Git failed");
    }),
  ).resolves.toEqual({
    error: "Repository ignore files could not be listed. Nested overrides are unknown.",
  });
  await expect(
    readNestedGitignorePaths("repo", async () => ({ stdout: Buffer.from("incomplete") })),
  ).resolves.toEqual({
    error: "Repository ignore files could not be listed. Nested overrides are unknown.",
  });
});
