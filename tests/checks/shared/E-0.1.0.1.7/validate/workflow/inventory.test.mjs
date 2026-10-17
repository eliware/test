import { expect, test } from "@jest/globals";
import { validateWorkflowInventory } from "../../../../../../src/checks/shared/E-0.1.0.1.7/validate/workflow/inventory.mjs";

const ci = ".github/workflows/ci.yaml";
const npm = ".github/workflows/npm.yaml";
const ghcr = ".github/workflows/ghcr.yaml";
const legacy = ".github/workflows/publish.yaml";

function inventory(files) {
  return { files: async () => files };
}

test("allows only CI for general repositories", async () => {
  await expect(
    validateWorkflowInventory(inventory([ci]), { eliware: { apply: ["general"] } }),
  ).resolves.toEqual([]);
  await expect(
    validateWorkflowInventory(inventory([ci, legacy]), { eliware: { apply: ["general"] } }),
  ).resolves.toContain(`Unexpected workflow file: ${legacy}.`);
});

test.each([
  ["npm-published", npm],
  ["ghcr-published", ghcr],
])("allows the canonical workflow for %s", async (profile, publisher) => {
  await expect(
    validateWorkflowInventory(inventory([ci, publisher]), {
      eliware: { apply: ["general", profile] },
    }),
  ).resolves.toEqual([]);
});

test("allows both publisher workflows when both profiles apply", async () => {
  await expect(
    validateWorkflowInventory(inventory([ci, npm, ghcr]), {
      eliware: { apply: ["general", "npm-published", "ghcr-published"] },
    }),
  ).resolves.toEqual([]);
});

test("rejects legacy and unrelated workflow files", async () => {
  await expect(
    validateWorkflowInventory(inventory([ci, npm, legacy]), {
      eliware: { apply: ["general", "npm-published"] },
    }),
  ).resolves.toContain(`Unexpected workflow file: ${legacy}.`);
  await expect(
    validateWorkflowInventory(inventory([ci, ".github/workflows/extra.yaml"]), {
      eliware: { apply: ["general", "npm-published"] },
    }),
  ).resolves.toContain("Unexpected workflow file: .github/workflows/extra.yaml.");
});

test("reports missing or unreadable workflow inventories", async () => {
  await expect(validateWorkflowInventory(inventory([]))).resolves.toEqual([`${ci} is required.`]);
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
