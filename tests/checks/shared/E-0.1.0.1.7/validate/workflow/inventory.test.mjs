import { expect, test } from "@jest/globals";
import { validateWorkflowInventory } from "../../../../../../src/checks/shared/E-0.1.0.1.7/validate/workflow/inventory.mjs";

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

test.each(["npm-published", "ghcr-published"])(
  "allows the publish workflow for the %s profile",
  async (profile) => {
    await expect(
      validateWorkflowInventory(
        inventory([".github/workflows/ci.yaml", ".github/workflows/publish.yaml"]),
        { eliware: { apply: ["general", profile] } },
      ),
    ).resolves.toEqual([]);
  },
);

test("rejects extra workflows when a publication profile applies", async () => {
  await expect(
    validateWorkflowInventory(
      inventory([
        ".github/workflows/ci.yaml",
        ".github/workflows/publish.yaml",
        ".github/workflows/extra.yaml",
      ]),
      { eliware: { apply: ["general", "npm-published"] } },
    ),
  ).resolves.toContain("Unexpected workflow file: .github/workflows/extra.yaml.");
});

test("reports missing or unreadable workflow inventories", async () => {
  await expect(validateWorkflowInventory(inventory([]))).resolves.toEqual([
    ".github/workflows/ci.yaml is required.",
  ]);
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
