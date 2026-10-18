import { expect, test } from "@jest/globals";
import { validateNpmPublishWorkflow } from "../../../../src/checks/npm-published/E-0.1.10.1.2/validate-npm-publish-workflow.mjs";
import {
  createNpmPublishInventory,
  npmPublishWorkflow,
} from "../../../../test-fixtures/npm-publish-workflow.mjs";

test("compares the npm workflow with the canonical bytes", async () => {
  await expect(validateNpmPublishWorkflow(createNpmPublishInventory())).resolves.toEqual([]);
});

test.each([
  ["one changed byte", `${npmPublishWorkflow} `],
  ["different line endings", npmPublishWorkflow.replaceAll("\n", "\r\n")],
  ["a missing final newline", npmPublishWorkflow.trimEnd()],
])("rejects a workflow with %s", async (_name, workflow) => {
  await expect(validateNpmPublishWorkflow(createNpmPublishInventory(workflow))).resolves.toContain(
    ".github/workflows/npm.yaml must match the bundled Eliware Test file specs/workflows/npm.yaml byte for byte.",
  );
});
