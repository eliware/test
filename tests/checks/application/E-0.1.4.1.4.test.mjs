import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../src/checks/application/E-0.1.4.1.4.mjs";

test("E-0.1.4.1.4 accepts valid notes and a README link", async () => {
  const inventory = {
    readText: async (path) =>
      path.endsWith("RELEASE_NOTES.md")
        ? releaseNotes
        : "## Usage\n\n[Release notes](RELEASE_NOTES.md)",
  };
  await expect(run({ root: "repo", repositoryInventory: inventory })).resolves.toEqual({
    ruleId,
    status: "pass",
    message: "",
  });
});

test("E-0.1.4.1.4 reports missing release notes", async () => {
  await expect(
    run({
      root: "repo",
      repositoryInventory: {
        readText: async () => {
          throw new Error("missing");
        },
      },
    }),
  ).resolves.toMatchObject({ ruleId, status: "fail", message: "RELEASE_NOTES.md is required." });
});

test("E-0.1.4.1.4 uses its default context", async () => {
  await expect(run(undefined)).resolves.toMatchObject({ ruleId, status: "pass" });
});

const releaseNotes =
  "# Release Notes\n\n## Unreleased\n\n### Changed\n\nPending.\n\n## 12.0.0 — 2026-06-01\n\n### Added\n\nInitial release.\n";
