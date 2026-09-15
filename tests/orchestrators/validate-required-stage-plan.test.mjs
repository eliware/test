import { expect, test } from "@jest/globals";
import { validateRequiredStagePlan } from "../../src/orchestrators/validate-required-stage-plan.mjs";

test("accepts all enabled stage owners", () => {
  const ids = ["E-1.20", "E-1.4", "E-1.20.19", "E-1.140.1", "E-1.20.17"];
  expect(() => validateRequiredStagePlan(ids.map((ruleId) => ({ ruleId })), {
    executeJest: true, executeLint: true, executeAudit: true, executePack: true,
    executeFormat: true, executePackageChecks: true,
  })).not.toThrow();
});

test("allows an explicitly exempted stage owner", () => {
  expect(() => validateRequiredStagePlan([], { executeAudit: true }, new Set(["E-1.20.19"]))).not.toThrow();
});

test("does not require unrelated stages during a focused run", () => {
  expect(() => validateRequiredStagePlan([], { executeAudit: true, jestArgs: ["tests/example.test.mjs"] })).not.toThrow();
});
