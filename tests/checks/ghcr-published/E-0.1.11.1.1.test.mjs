import { expect, test } from "@jest/globals";
import { createGhcrInventory, ghcrPackage } from "../../../test-fixtures/ghcr-workflow.mjs";
import { ruleId, run } from "../../../src/checks/ghcr-published/E-0.1.11.1.1.mjs";
test("accepts the valid workflow through the rule", async () => {
  await expect(
    run({ repositoryInventory: createGhcrInventory(), packageJson: ghcrPackage }),
  ).resolves.toEqual({ ruleId, status: "pass", message: "" });
});
test("converts detailed validation errors to the rule result", async () => {
  await expect(run()).resolves.toMatchObject({
    ruleId,
    status: "fail",
    message: "publish.yaml could not be inspected.",
  });
});
