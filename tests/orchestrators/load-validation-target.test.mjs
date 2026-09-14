import { expect, test } from "@jest/globals";
import { fixture } from "../../test-fixtures/run-validation.mjs";
import { loadValidationTarget } from "../../src/orchestrators/load-validation-target.mjs";

test("loads the target package metadata", async () => {
  const root = await fixture({ apply: ["general"] });
  const packageJson = await loadValidationTarget(root);
  expect(packageJson.name).toBe("@eliware/fixture");
  expect(packageJson.eliware.apply).toEqual(["general"]);
});
