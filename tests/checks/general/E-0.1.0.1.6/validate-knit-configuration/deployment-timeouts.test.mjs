import { expect, test } from "@jest/globals";
import validateDeploymentTimeout from "../../../../../src/checks/general/E-0.1.0.1.6/validate-knit-configuration/deployment-timeouts.mjs";
test("accepts the required deployment timeout", () => {
  expect(validateDeploymentTimeout({ timeoutMs: 300000 }, "deployment")).toEqual([]);
});
test("requires each deployment to set the required timeout", () => {
  expect(validateDeploymentTimeout({}, "deployment 1")).toEqual([
    "deployment 1 must set timeoutMs to 300000.",
  ]);
});
