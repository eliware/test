import { expect, test } from "@jest/globals";
import { validateGitIgnoreFiles } from "../../../../src/checks/general/E-0.1.0.1.8/validate-git-ignore-files.mjs";

function cleanGit() {
  return async () => ({ stdout: Buffer.from("") });
}

test("accepts clean nested-ignore and tracked-path results", async () => {
  await expect(validateGitIgnoreFiles("repo", cleanGit())).resolves.toEqual([]);
});

test("reports nested ignore files and tracked ignored paths", async () => {
  const runGit = async (_command, args) => {
    if (args.includes("--cached") && args.includes(":(glob)**/.gitignore"))
      return { stdout: Buffer.from("docs/.gitignore\0") };
    if (args.includes("--others")) return { stdout: Buffer.from("") };
    return { stdout: Buffer.from("tracked-output\0") };
  };
  const errors = await validateGitIgnoreFiles("repo", runGit);
  expect(errors).toContain("Nested .gitignore files are prohibited: docs/.gitignore.");
  expect(errors).toContain("Tracked or staged paths match ignore rules: tracked-output.");
});

test("reports failures while listing nested or tracked ignore paths", async () => {
  const runGit = async (_command, args) => {
    if (args.includes(":(glob)**/.gitignore")) throw new Error("nested scan failed");
    throw new Error("index scan failed");
  };
  const errors = await validateGitIgnoreFiles("repo", runGit);
  expect(errors).toEqual([
    "Repository ignore files could not be listed; nested overrides are unknown.",
    "Git index status could not be read; tracked ignore status is unknown.",
  ]);
});

test("reports malformed Git path output", async () => {
  const runGit = async (_command, args) => ({
    stdout: Buffer.from(args.includes(":(glob)**/.gitignore") ? "bad" : "also-bad"),
  });
  const errors = await validateGitIgnoreFiles("repo", runGit);
  expect(errors).toEqual([
    "Repository ignore files could not be listed; nested overrides are unknown.",
    "Git index status could not be read; tracked ignore status is unknown.",
  ]);
});
