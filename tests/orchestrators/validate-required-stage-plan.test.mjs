import { expect, test } from "@jest/globals";
import { validateRequiredStagePlan } from "../../src/orchestrators/validate-required-stage-plan.mjs";

test("accepts all enabled stage owners", () => {
  const ids = ["E-1.20", "E-1.4", "E-1.20.19", "E-1.140.1", "E-1.20.17"];
  expect(() => validateRequiredStagePlan(ids.map((ruleId) => ({ ruleId })), {
    executeJest: true, executeLint: true, executeAudit: true, executePack: true,
    executeFormat: true, executePackageChecks: true,
    packageJson: { eliware: { apply: ["general", "npm-published"] } },
  })).not.toThrow();
});

test("does not require the npm pack owner for repositories without the npm-published profile", () => {
  const ids = ["E-1.20", "E-1.4", "E-1.20.19", "E-1.20.17"];
  expect(() => validateRequiredStagePlan(ids.map((ruleId) => ({ ruleId })), {
    executeJest: true, executeLint: true, executeAudit: true, executePack: true,
    executeFormat: true,
    packageJson: { private: true, eliware: { apply: ["general", "application", "private"] } },
  })).not.toThrow();
});

test("still requires the npm pack owner when npm-published applies", () => {
  const ids = ["E-1.20", "E-1.4", "E-1.20.19", "E-1.20.17"];
  expect(() => validateRequiredStagePlan(ids.map((ruleId) => ({ ruleId })), {
    executeJest: true, executeLint: true, executeAudit: true, executePack: true,
    executeFormat: true,
    packageJson: { eliware: { apply: ["general", "npm-published"] } },
  })).toThrow("executePack (E-1.140.1)");
});

test("allows an explicitly exempted stage owner", () => {
  expect(() => validateRequiredStagePlan([], { executeAudit: true }, new Set(["E-1.20.19"]))).not.toThrow();
});

test("does not require unrelated stages during a focused run", () => {
  expect(() => validateRequiredStagePlan([], { executeAudit: true, jestArgs: ["tests/example.test.mjs"] })).not.toThrow();
});
