import { expect, test } from "@jest/globals";
import { enforcementMode, parentRuleId, ruleId, run } from "../../../../../src/checks/infrastructure/E-0.1.90/A-0.1.90.0/A-0.1.90.0.4.mjs";

test("exports the expected identity for its non-deterministic rule", () => {
  expect({ ruleId, parentRuleId, enforcementMode }).toEqual({
    ruleId: "A-0.1.90.0.4",
    parentRuleId: "A-0.1.90.0",
    enforcementMode: "non-deterministic",
  });
  expect(run().ruleId).toBe(ruleId);
});