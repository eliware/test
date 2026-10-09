import { expect, test } from "@jest/globals";
import { readFile } from "node:fs/promises";
import { ruleId, run } from "../../../src/checks/npm-published/E-0.1.10.1.0.mjs";

test("E-0.1.10.1.0 requires the npm publication AGENTS section", async () => {
  await expect(
    run({
      packageJson: JSON.parse(await readFile("package.json", "utf8")),
      repositoryInventory: { readText: async (path) => readFile(path, "utf8") },
    }),
  ).resolves.toEqual({ ruleId, status: "pass", message: "" });
  await expect(run()).resolves.toMatchObject({
    ruleId,
    status: "fail",
    message: expect.stringContaining("Repository documents could not be inspected"),
  });
  await expect(
    run({
      packageJson: JSON.parse(await readFile("package.json", "utf8")),
      repositoryInventory: {
        readText: async (path) => (path === "AGENTS.md" ? "## npm publication" : "invalid"),
      },
    }),
  ).resolves.toMatchObject({ message: expect.stringContaining("canonical npm") });
});
