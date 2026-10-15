import { expect, test } from "@jest/globals";
import { run, ruleId } from "../../../src/checks/library/E-0.1.3.1.4.mjs";
import { packageVersion } from "../../helpers/project-version.mjs";

test("enforces shared release note rules for libraries", async () => {
  const repositoryInventory = {
    readText: async (path) =>
      path.endsWith("RELEASE_NOTES.md")
        ? `# Release Notes\n\n## ${packageVersion} — 2026-10-15\n\n### Added\n\nInitial release.`
        : "## Usage\n\n- [Release notes](RELEASE_NOTES.md)",
  };
  await expect(
    run({ root: "/repo", packageJson: { version: packageVersion }, repositoryInventory }),
  ).resolves.toEqual({
    ruleId,
    status: "pass",
    message: "",
  });
  await expect(
    run({
      root: "/repo",
      packageJson: { version: packageVersion },
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

test("rejects Unreleased in library release notes", async () => {
  await expect(
    run({
      root: "/repo",
      packageJson: { version: packageVersion },
      repositoryInventory: {
        readText: async (path) =>
          path.endsWith("RELEASE_NOTES.md")
            ? `# Release Notes\n\n## ${packageVersion} — 2026-10-15\n\n### Added\n\nUnreleased feature.`
            : "## Usage\\n\\n- [Release notes](RELEASE_NOTES.md)",
      },
    }),
  ).resolves.toMatchObject({
    status: "fail",
    message: expect.stringContaining("must not contain the word Unreleased"),
  });
});

test("enforces release note policy for the valid library profile set", async () => {
  await expect(
    run({
      root: "/repo",
      packageJson: { version: packageVersion, eliware: { apply: ["general", "library"] } },
      repositoryInventory: {
        readText: async (path) =>
          path.endsWith("RELEASE_NOTES.md")
            ? `# Release Notes\n\n## ${packageVersion} — 2026-10-15\n\n### Added\n\nInitial release.`
            : "## Usage\n\n- [Release notes](RELEASE_NOTES.md)",
      },
    }),
  ).resolves.toMatchObject({
    status: "pass",
  });
});
