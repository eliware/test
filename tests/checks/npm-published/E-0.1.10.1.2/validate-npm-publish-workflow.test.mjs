import { expect, test } from "@jest/globals";
import { validateNpmPublishWorkflow } from "../../../../src/checks/npm-published/E-0.1.10.1.2/validate-npm-publish-workflow.mjs";
import { createNpmPublishInventory } from "../../../../test-fixtures/npm-publish-workflow.mjs";

test("compares the npm workflow with the canonical bytes", async () => {
  await expect(validateNpmPublishWorkflow(createNpmPublishInventory())).resolves.toEqual([]);
});

test("rejects a workflow with changed bytes", async () => {
  await expect(
    validateNpmPublishWorkflow(createNpmPublishInventory("name: Changed\n")),
  ).resolves.toContain(
    ".github/workflows/npm.yaml must match the bundled Eliware Test file specs/workflows/npm.yaml byte for byte.",
  );
});
