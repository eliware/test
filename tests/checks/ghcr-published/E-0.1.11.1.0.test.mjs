import { expect, test } from "@jest/globals";
import { createGhcrInventory, ghcrPackage } from "../../../test-fixtures/ghcr-workflow.mjs";
import { ruleId, run } from "../../../src/checks/ghcr-published/E-0.1.11.1.0.mjs";

test("accepts package-specific GHCR usage markers", async () => {
  await expect(
    run({ repositoryInventory: createGhcrInventory(), packageJson: ghcrPackage }),
  ).resolves.toEqual({ ruleId, status: "pass", message: "" });
});

test("rejects missing GHCR usage markers", async () => {
  await expect(
    run({
      repositoryInventory: createGhcrInventory({ agents: "## GHCR publication" }),
      packageJson: ghcrPackage,
    }),
  ).resolves.toMatchObject({ status: "fail", message: expect.stringContaining("Pull command") });
});

test("reports missing context and package data", async () => {
  await expect(run()).resolves.toMatchObject({
    ruleId,
    status: "fail",
    message: expect.stringContaining("AGENTS.md could not be inspected"),
  });
});

test("reports unreadable AGENTS content", async () => {
  const inventory = createGhcrInventory();
  await expect(
    run({
      repositoryInventory: {
        ...inventory,
        readText: async (path) => {
          if (path === "AGENTS.md") throw new Error("denied");
          return inventory.readText(path);
        },
      },
      packageJson: ghcrPackage,
    }),
  ).resolves.toMatchObject({
    message: expect.stringContaining("AGENTS.md could not be inspected: denied"),
  });
});
