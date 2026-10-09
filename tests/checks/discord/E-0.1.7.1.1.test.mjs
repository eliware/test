import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../src/checks/discord/E-0.1.7.1.1.mjs";

test("requires Discord profile sections", async () => {
  const repositoryInventory = {
    readText: async (path) =>
      path === "AGENTS.md" ? "## Discord" : "## Events\n## Intents and permissions",
  };
  await expect(run({ repositoryInventory })).resolves.toEqual({
    ruleId,
    status: "pass",
    message: "",
  });
});

test("reports missing Discord profile sections", async () => {
  const repositoryInventory = { readText: async () => "" };
  await expect(run({ repositoryInventory })).resolves.toMatchObject({
    ruleId,
    status: "fail",
    message: expect.stringContaining("AGENTS.md must include: ## Discord"),
  });
});

test("uses default context", async () => {
  await expect(run()).resolves.toMatchObject({ ruleId, status: "fail" });
});
