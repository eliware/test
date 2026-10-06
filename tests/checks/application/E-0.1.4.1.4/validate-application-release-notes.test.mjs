import { expect, test } from "@jest/globals";
import { validateApplicationReleaseNotes } from "../../../../src/checks/application/E-0.1.4.1.4/validate-application-release-notes.mjs";

test("reports a missing README link after reading release notes", async () => {
  const inventory = {
    readText: async (path) => (path.endsWith("README.md") ? "" : "# Release Notes\n"),
  };
  await expect(
    validateApplicationReleaseNotes({ root: "repo", repositoryInventory: inventory }),
  ).resolves.toContain("README.md Links must contain RELEASE_NOTES.md.");
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
  ).resolves.toContain("README.md Links must contain RELEASE_NOTES.md.");
});

test("uses the default context", async () => {
  await expect(validateApplicationReleaseNotes()).resolves.toEqual([]);
});
