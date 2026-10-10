import { expect, test } from "@jest/globals";
import { run, ruleId } from "../../../src/checks/library/E-0.1.3.1.4.mjs";

test("enforces shared release note rules for libraries", async () => {
  const repositoryInventory = {
    readText: async (path) =>
      path.endsWith("RELEASE_NOTES.md")
        ? "# Release Notes\n\n## Unreleased\n\n### Changed\n\nUpdate.\n\n## 12.0.0 — 2026-06-01\n\n### Added\n\nInitial release."
        : "## Usage\n\n- [Release notes](RELEASE_NOTES.md)",
  };
  await expect(
    run({ root: "/repo", packageJson: { version: "12.0.0" }, repositoryInventory }),
  ).resolves.toEqual({
    ruleId,
    status: "pass",
    message: "",
  });
  await expect(
    run({
      root: "/repo",
      packageJson: { version: "12.0.0" },
      repositoryInventory: {
        readText: async () => {
          throw new Error();
        },
      },
    }),
  ).resolves.toMatchObject({
    status: "fail",
    message: expect.stringContaining("RELEASE_NOTES.md is required."),
  });
});

test("requires package metadata in its context", async () => {
  await expect(run()).resolves.toMatchObject({
    status: "fail",
    message: expect.stringContaining("package.json.version is required"),
  });
});

test("enforces release note policy for the valid library profile set", async () => {
  await expect(
    run({
      root: "/repo",
      packageJson: { version: "12.0.0", eliware: { apply: ["general", "library"] } },
      repositoryInventory: {
        readText: async (path) =>
          path.endsWith("RELEASE_NOTES.md")
            ? "# Release Notes\n\n## Unreleased\n\n### Changed\n\nUpdate.\n\n## 12.0.0 — 2026-06-01\n\n### Added\n\nInitial release."
            : "## Usage\n\n- [Release notes](RELEASE_NOTES.md)",
      },
    }),
  ).resolves.toMatchObject({
    status: "pass",
  });
});
