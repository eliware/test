import { expect, test } from "@jest/globals";
import { executeValidationPlan } from "../../src/orchestrators/execute-validation-plan.mjs";

test("executes selected checks after validating the plan", async () => {
  const checks = [{ ruleId: "E-1.0", run: async () => ({ ruleId: "E-1.0", status: "pass" }) }];
  await expect(executeValidationPlan(checks, {}, new Set())).resolves.toEqual([
    { ruleId: "E-1.0", status: "pass" },
  ]);
});

test("requires the check that owns each enabled aggregate stage", async () => {
  await expect(executeValidationPlan(
    [{ ruleId: "E-1.20", run: async () => ({ ruleId: "E-1.20", status: "pass" }) }],
    { executeJest: true, executeAudit: true },
    new Set(),
  )).rejects.toThrow("executeAudit");
});

test("proves aggregate stage applicability before applying an explicit mode filter", async () => {
  await expect(executeValidationPlan(
    [{ ruleId: "E-1.20.17", run: async () => ({ ruleId: "E-1.20.17", status: "pass" }) }],
    { executeLint: true, modeRuleId: "E-1.20.17" },
    new Set(),
  )).rejects.toThrow("executeLint");
});
