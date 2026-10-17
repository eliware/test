import { expect, jest, test } from "@jest/globals";
import { validateApplicationReleaseNotes } from "../../../../../src/checks/application/E-0.1.4.1.4/validate/application-release-notes.mjs";
import { packageVersion } from "../../../../../test-fixtures/helpers/project-version.mjs";

test("requires readable release notes", async () => {
  await expect(
    validateApplicationReleaseNotes({
      repositoryInventory: { readText: async () => Promise.reject(new Error("missing")) },
    }),
  ).resolves.toEqual(["RELEASE_NOTES.md is required."]);
});

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

test("accepts the current release without querying historical tags", async () => {
  const runGit = jest.fn();
  const repositoryInventory = {
    readText: async (path) =>
      path.endsWith("RELEASE_NOTES.md")
        ? `# Release Notes\n\n## ${packageVersion} — 2026-10-17\n\n### Added\n\nInitial release.`
        : "## Usage\n\n[Release notes](RELEASE_NOTES.md)",
  };
  await expect(
    validateApplicationReleaseNotes(
      { packageJson: { version: packageVersion }, repositoryInventory },
      { runGit },
    ),
  ).resolves.toEqual([]);
  expect(runGit).not.toHaveBeenCalled();
});

test("uses a context Git runner when the context provides one", async () => {
  const runGit = jest.fn();
  const repositoryInventory = {
    readText: async (path) =>
      path.endsWith("RELEASE_NOTES.md")
        ? `# Release Notes\n\n## ${packageVersion} — 2026-10-17\n\n### Added\n\nInitial release.`
        : "## Usage\n\n[Release notes](RELEASE_NOTES.md)",
  };
  await expect(
    validateApplicationReleaseNotes({
      packageJson: { version: packageVersion },
      repositoryInventory,
      runGit,
    }),
  ).resolves.toEqual([]);
  expect(runGit).not.toHaveBeenCalled();
});

test("requires package metadata without a context", async () => {
  await expect(validateApplicationReleaseNotes()).resolves.toContain(
    "package.json.version is required for release-note validation.",
  );
});
