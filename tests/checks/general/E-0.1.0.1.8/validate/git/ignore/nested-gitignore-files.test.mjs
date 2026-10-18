import { expect, test } from "@jest/globals";
import { validateNestedGitIgnoreFiles } from "../../../../../../../src/checks/general/E-0.1.0.1.8/validate/git/ignore/nested-gitignore-files.mjs";

test("finds nested ignore files in tracked, untracked, and ignored paths", async () => {
  const runGit = async (_command, args) => {
    if (args.includes("--cached")) return { stdout: Buffer.from("docs/.gitignore\0") };
    if (args.includes("--ignored")) return { stdout: Buffer.from("build/.gitignore\0") };
    return { stdout: Buffer.from("examples/.gitignore\0.gitignore\0") };
  };
  await expect(validateNestedGitIgnoreFiles("repo", runGit)).resolves.toEqual([
    "Nested .gitignore files are prohibited: docs/.gitignore, examples/.gitignore, build/.gitignore.",
  ]);
});

test("returns no finding when no nested ignore file exists", async () => {
  await expect(
    validateNestedGitIgnoreFiles("repo", async () => ({ stdout: Buffer.from(".gitignore\0") })),
  ).resolves.toEqual([]);
});

test("skips paths that match a rule exemption", async () => {
  await expect(
    validateNestedGitIgnoreFiles(
      "repo",
      async () => ({ stdout: Buffer.from("docs/.gitignore\0other/.gitignore\0") }),
      (path) => path === "docs/.gitignore",
    ),
  ).resolves.toEqual(["Nested .gitignore files are prohibited: other/.gitignore."]);
});

test("reports Git command failures", async () => {
  await expect(
    validateNestedGitIgnoreFiles("repo", async () => {
      throw new Error("Git failed");
    }),
  ).resolves.toEqual([
    "Repository ignore files could not be listed. Nested overrides are unknown.",
  ]);
});
