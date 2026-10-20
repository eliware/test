import { expect, jest, test } from "@jest/globals";
import { validateReleaseTagVersions } from "../../../../../../src/checks/general/E-0.1.0.1.13/validate/release/validate-release-tags.mjs";
import {
  packageVersion,
  previousMajorVersion,
} from "../../../../../../test-fixtures/helpers/project-version.mjs";

const entries = [`## ${packageVersion} — 2026-10-15`, `## ${previousMajorVersion} — 2026-10-14`];

test("accepts a tagged old release and an untagged current version", async () => {
  const runGit = jest.fn(async (_command, args) => ({
    stdout: args.includes("--is-shallow-repository") ? "false" : `v${previousMajorVersion}\n`,
  }));
  await expect(
    validateReleaseTagVersions("repo", entries, packageVersion, runGit),
  ).resolves.toEqual([]);
  expect(runGit).toHaveBeenCalledWith(
    "git",
    ["-C", "repo", "tag", "--list"],
    expect.objectContaining({ encoding: "utf8" }),
  );
});

test("rejects an old release without its exact version tag", async () => {
  await expect(
    validateReleaseTagVersions("repo", entries, packageVersion, async (_command, args) => ({
      stdout: args.includes("--is-shallow-repository") ? "false" : "v1.0.0",
    })),
  ).resolves.toEqual([
    `RELEASE_NOTES.md version ${previousMajorVersion} requires repository tag v${previousMajorVersion}.`,
  ]);
});

test("reports a Git tag read failure", async () => {
  await expect(
    validateReleaseTagVersions("repo", entries, packageVersion, async () => {
      throw new Error("git failed");
    }),
  ).resolves.toEqual(["Repository tags could not be read for release-note validation."]);
});

test("requires complete Git history", async () => {
  const runGit = jest.fn().mockResolvedValue({ stdout: "true" });
  await expect(
    validateReleaseTagVersions("repo", entries, packageVersion, runGit),
  ).resolves.toEqual(["Full Git tag history is required for release-note validation."]);
  expect(runGit).toHaveBeenCalledTimes(1);
});

test("does not read tags when the only entry is the current package version", async () => {
  const runGit = jest.fn();
  await expect(
    validateReleaseTagVersions("repo", [entries[0]], packageVersion, runGit),
  ).resolves.toEqual([]);
  expect(runGit).not.toHaveBeenCalled();
});
