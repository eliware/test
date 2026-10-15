import { expect, jest, test } from "@jest/globals";
import { validateApplicationReleaseNotes } from "../../../../../src/checks/application/E-0.1.4.1.4/validate/application-release-notes.mjs";
import { packageVersion, previousMajorVersion } from "../../../../helpers/project-version.mjs";

test("reports a missing README link after reading release notes", async () => {
  const inventory = {
    readText: async (path) => (path.endsWith("README.md") ? "" : "# Release Notes\n"),
  };
  await expect(
    validateApplicationReleaseNotes({ root: "repo", repositoryInventory: inventory }),
  ).resolves.toContain("README.md Usage must link RELEASE_NOTES.md.");
});

test("reports an unreadable README as a missing release notes link", async () => {
  const inventory = {
    readText: async (path) => {
      if (path.endsWith("RELEASE_NOTES.md")) return "# Release Notes";
      throw new Error("missing");
    },
  };
  await expect(
    validateApplicationReleaseNotes({ root: "repo", repositoryInventory: inventory }),
  ).resolves.toContain("README.md Usage must link RELEASE_NOTES.md.");
});

test("uses the default context", async () => {
  const runGit = jest.fn(async (_command, args) => ({
    stdout: args.includes("--is-shallow-repository") ? "false" : `v${previousMajorVersion}\n`,
  }));
  const repositoryInventory = {
    readText: async (path) =>
      path.endsWith("RELEASE_NOTES.md")
        ? `# Release Notes\n\n## ${packageVersion} — 2026-10-15\n\n### Added\n\nInitial release.\n\n## ${previousMajorVersion} — 2026-10-14\n\n### Fixed\n\nOld release.`
        : "## Usage\n\n[Release notes](RELEASE_NOTES.md)",
  };
  await expect(
    validateApplicationReleaseNotes(
      { packageJson: { version: packageVersion }, repositoryInventory },
      { runGit },
    ),
  ).resolves.toEqual([]);
  expect(runGit).toHaveBeenCalledWith(
    "git",
    ["-C", process.cwd(), "tag", "--list"],
    expect.objectContaining({ encoding: "utf8" }),
  );
});

test("requires package metadata without a context", async () => {
  await expect(validateApplicationReleaseNotes()).resolves.toContain(
    "package.json.version is required for release-note validation.",
  );
});
