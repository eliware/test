import { expect, jest, test } from "@jest/globals";
import { requiredIgnoreCases } from "../../../../../../../src/checks/general/E-0.1.0.1.8/validate/ignore-patterns.mjs";
import { validateGitIgnoreProbes } from "../../../../../../../src/checks/general/E-0.1.0.1.8/validate/git/ignore/probes.mjs";

test("checks all ignore probes in one Git call", async () => {
  const runGit = jest.fn(async () => ({
    stdout: Buffer.from(
      requiredIgnoreCases
        .filter(([, shouldIgnore]) => shouldIgnore)
        .map(([path]) => `ignore-pattern\t${path}`)
        .join("\n"),
    ),
  }));

  await expect(validateGitIgnoreProbes("repo", runGit)).resolves.toEqual([]);
  expect(runGit).toHaveBeenCalledTimes(1);
  expect(runGit.mock.calls[0][1]).toEqual([
    "-C",
    "repo",
    "check-ignore",
    "--verbose",
    "--",
    ...requiredIgnoreCases.map(([path]) => path),
  ]);
});

test("reports ignored and unignored path mismatches", async () => {
  const ignored = requiredIgnoreCases
    .filter(([path]) => path === "package.json")
    .map(([path]) => `ignore-pattern\t${path}`)
    .join("\n");
  const errors = await validateGitIgnoreProbes("repo", async () => ({ stdout: ignored }));

  expect(errors).toHaveLength(requiredIgnoreCases.length);
  expect(errors.some((error) => error.includes("must be ignored."))).toBe(true);
  expect(errors.some((error) => error.includes("must not be ignored"))).toBe(true);
});

test("reports missing Git and command failures", async () => {
  const missing = await validateGitIgnoreProbes("repo", async () => {
    throw Object.assign(new Error("missing"), { code: "ENOENT" });
  });
  const failed = await validateGitIgnoreProbes("repo", async () => ({ code: 2 }));

  expect(missing).toHaveLength(requiredIgnoreCases.length);
  expect(failed).toHaveLength(requiredIgnoreCases.length);
  expect(failed.every((error) => error.includes("could not be inspected"))).toBe(true);
});

test("treats Git exit code one as no ignored paths", async () => {
  const errors = await validateGitIgnoreProbes("repo", async () => ({ code: 1, stdout: "" }));

  expect(errors).toHaveLength(requiredIgnoreCases.filter(([, ignored]) => ignored).length);
});

test("handles a code-one error without path output", async () => {
  const error = Object.assign(new Error("no matches"), { code: 1 });

  const errors = await validateGitIgnoreProbes("repo", async () => Promise.reject(error));

  expect(errors).toHaveLength(requiredIgnoreCases.filter(([, ignored]) => ignored).length);
});

test("handles missing output from a successful Git call", async () => {
  const errors = await validateGitIgnoreProbes("repo", async () => ({ code: 0 }));

  expect(errors).toHaveLength(requiredIgnoreCases.filter(([, ignored]) => ignored).length);
});

test("uses ignored paths returned with a code-one error", async () => {
  const error = Object.assign(new Error("no matches"), {
    code: 1,
    stdout: requiredIgnoreCases
      .filter(([, shouldIgnore]) => shouldIgnore)
      .map(([path]) => `ignore-pattern\t${path}`)
      .join("\n"),
  });

  await expect(validateGitIgnoreProbes("repo", async () => Promise.reject(error))).resolves.toEqual(
    [],
  );
});
