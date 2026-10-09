import { expect, test } from "@jest/globals";
import { validateWorkflowInventory } from "../../../../src/checks/shared/E-0.1.0.1.7/validate-workflow-inventory.mjs";

function inventory(files) {
  return { files: async () => files };
}

test("allows only CI for general repositories", async () => {
  await expect(
    validateWorkflowInventory(inventory([".github/workflows/ci.yaml"]), {
      eliware: { apply: ["general"] },
    }),
  ).resolves.toEqual([]);
  await expect(
    validateWorkflowInventory(
      inventory([".github/workflows/ci.yaml", ".github/workflows/publish.yaml"]),
      { eliware: { apply: ["general"] } },
    ),
  ).resolves.toContain("Unexpected workflow file: .github/workflows/publish.yaml.");
});

test("allows the publish workflow for publishing profiles", async () => {
  await expect(
    validateWorkflowInventory(
      inventory([".github/workflows/ci.yaml", ".github/workflows/publish.yaml"]),
      { eliware: { apply: ["general", "npm-published"] } },
    ),
  ).resolves.toEqual([]);
});

test("reports missing or unreadable workflow inventories", async () => {
  await expect(
    validateWorkflowInventory({
      files: async () => {
        throw new Error("offline");
      },
    }),
  ).resolves.toEqual(["GitHub workflow files could not be inspected: offline"]);
  await expect(validateWorkflowInventory({})).resolves.toEqual([
    "GitHub workflow files could not be inspected.",
  ]);
});
