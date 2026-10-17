import { expect, test } from "@jest/globals";
import { createGhcrInventory } from "../../../test-fixtures/ghcr-workflow.mjs";
import { ruleId, run } from "../../../src/checks/ghcr-published/E-0.1.11.1.1.mjs";

test("accepts the canonical GHCR workflow through the rule", async () => {
  await expect(run({ repositoryInventory: createGhcrInventory() })).resolves.toEqual({
    ruleId,
    status: "pass",
    message: "",
  });
});

test("reports an unavailable repository inventory", async () => {
  await expect(run()).resolves.toMatchObject({
    ruleId,
    status: "fail",
    message: "Repository files could not be inspected.",
  });
});
