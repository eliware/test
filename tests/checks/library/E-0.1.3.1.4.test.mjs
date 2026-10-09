import { expect, test } from "@jest/globals";
import { run, ruleId } from "../../../src/checks/library/E-0.1.3.1.4.mjs";

test("enforces shared release note rules for libraries", async () => {
  const repositoryInventory = {
    readText: async (path) =>
      path.endsWith("RELEASE_NOTES.md")
        ? "# Release Notes\n\n## Unreleased\n\n### Changed\n\nUpdate."
        : "## Links\n\n- [Release notes](RELEASE_NOTES.md)",
  };
  await expect(run({ root: "/repo", repositoryInventory })).resolves.toEqual({
    ruleId,
    status: "pass",
    message: "",
  });
  await expect(
    run({
      root: "/repo",
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

test("uses the default context", async () => {
  await expect(run()).resolves.toMatchObject({ status: "pass" });
});

test("uses application checks when application also applies", async () => {
  await expect(
    run({ packageJson: { eliware: { apply: ["general", "application", "library"] } } }),
  ).resolves.toMatchObject({
    status: "pass",
    message: "Application checks enforce the shared release note rules.",
  });
});
