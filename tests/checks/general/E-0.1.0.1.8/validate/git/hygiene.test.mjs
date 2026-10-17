import * as childProcessModule from "node:child_process";
import { expect, jest, test } from "@jest/globals";
import { requiredIgnoreCases } from "../../../../../../src/checks/general/E-0.1.0.1.8/validate/ignore-patterns.mjs";

const execFile = jest.fn();
const runMockGit = jest.fn(async (_command, args) => {
  if (args.includes("check-ignore")) return { stdout: ignoredPaths() };
  return { stdout: Buffer.from("") };
});
execFile[Symbol.for("nodejs.util.promisify.custom")] = runMockGit;
jest.unstable_mockModule("node:child_process", () => ({ ...childProcessModule, execFile }));
const { validateGitHygiene } =
  await import("../../../../../../src/checks/general/E-0.1.0.1.8/validate/git/hygiene.mjs");

const ignoredPaths = (excludedPath) =>
  requiredIgnoreCases
    .filter(([path, shouldIgnore]) => shouldIgnore && path !== excludedPath)
    .map(([path]) => `ignore-pattern\t${path}`)
    .join("\n");

const ignoreRules = `node_modules/
.git/
coverage/
dist/
build/
generated/
artifacts/
test-results/
.DS_Store
Thumbs.db`;

test("uses the default Git runner and default exit code through a mocked executable", async () => {
  await expect(
    validateGitHygiene("repo", undefined, { readText: async () => ignoreRules }),
  ).resolves.toEqual([]);
  expect(runMockGit).toHaveBeenCalled();
});

test("rejects nested ignore files that can override universal rules", async () => {
  const runGit = async (_command, args) => {
    if (args.includes("check-ignore")) return { stdout: ignoredPaths() };
    if (args.includes("--others")) return { stdout: Buffer.from("docs/.gitignore\0") };
    return { stdout: Buffer.from("") };
  };
  await expect(
    validateGitHygiene("repo", runGit, { readText: async () => ignoreRules }),
  ).resolves.toContain("Nested .gitignore files are prohibited: docs/.gitignore.");
});

test("checks deep generated paths without checking environment names", async () => {
  const runGit = async (_command, args) => {
    if (args.includes("check-ignore"))
      return { stdout: ignoredPaths("nested/deep/layer/four/coverage/item.txt") };
    return { stdout: Buffer.from("") };
  };
  await expect(
    validateGitHygiene("repo", runGit, { readText: async () => ignoreRules }),
  ).resolves.toContain("nested/deep/layer/four/coverage/item.txt must be ignored.");
});

test("reports an unreadable ignore file", async () => {
  const runGit = async (_command, args) => {
    if (args.includes("check-ignore")) return { stdout: ignoredPaths() };
    return { stdout: Buffer.from("") };
  };
  const errors = await validateGitHygiene("repo", runGit, {
    readText: async () => {
      throw new Error("read denied");
    },
  });
  expect(errors).toContain(".gitignore could not be read to check required ignore rules.");
});

test("reads the repository ignore file by default", async () => {
  const runGit = async (_command, args) => {
    if (args.includes("check-ignore")) return { stdout: ignoredPaths() };
    return { stdout: Buffer.from("") };
  };
  await expect(validateGitHygiene(process.cwd(), runGit)).resolves.toEqual([]);
});

test("accepts string output from Git commands", async () => {
  const runGit = async (_command, args) => {
    if (args.includes("check-ignore")) return { code: 0, stdout: ignoredPaths() };
    return { code: 0, stdout: "" };
  };
  await expect(
    validateGitHygiene("repo", runGit, { readText: async () => ignoreRules }),
  ).resolves.toEqual([]);
});
