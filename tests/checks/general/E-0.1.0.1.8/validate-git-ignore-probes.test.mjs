import { expect, test } from "@jest/globals";
import { requiredIgnoreCases } from "../../../../src/checks/general/E-0.1.0.1.8/validate-ignore-patterns.mjs";
import { validateGitIgnoreProbes } from "../../../../src/checks/general/E-0.1.0.1.8/validate-git-ignore-probes.mjs";

test("accepts probe results that match required ignore behavior", async () => {
  const runGit = async (_command, args) =>
    args.at(-1).endsWith(".example")
      ? Promise.reject(Object.assign(new Error("not ignored"), { code: 1 }))
      : {};
  await expect(validateGitIgnoreProbes("repo", runGit)).resolves.toEqual([]);
});

test("reports ignored and unignored path mismatches", async () => {
  const runGit = async (_command, args) => {
    const shouldIgnore = requiredIgnoreCases.find(([path]) => path === args.at(-1))[1];
    return { code: shouldIgnore ? 1 : 0 };
  };
  const errors = await validateGitIgnoreProbes("repo", runGit);
  expect(errors).toHaveLength(requiredIgnoreCases.length);
  expect(errors[0]).toContain("must be ignored");
  expect(errors.some((error) => error.includes("must not be ignored"))).toBe(true);
});

test("reports Git failures and handles a missing command", async () => {
  const runGit = async () => {
    throw Object.assign(new Error("failed"), { code: "ENOENT" });
  };
  await expect(validateGitIgnoreProbes("repo", runGit)).resolves.toHaveLength(
    requiredIgnoreCases.length,
  );
});

test("treats exit code one as an ignore miss and reports other command failures", async () => {
  const runGit = async (_command, args) => {
    if (args.at(-1).endsWith(".example"))
      throw Object.assign(new Error("not ignored"), { code: 1 });
    throw Object.assign(new Error("failed"), { code: 2 });
  };
  const errors = await validateGitIgnoreProbes("repo", runGit);
  expect(errors).toHaveLength(requiredIgnoreCases.filter(([, ignore]) => ignore).length);
  expect(errors.every((error) => error.includes("could not be inspected"))).toBe(true);
});
