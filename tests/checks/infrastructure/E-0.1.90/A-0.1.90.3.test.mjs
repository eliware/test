import { expect, test } from "@jest/globals";
import { enforcementMode, parentRuleId, ruleId, run } from "../../../../src/checks/infrastructure/E-0.1.90/A-0.1.90.3.mjs";

test("exports the expected identity for its non-deterministic rule", () => {
  expect({ ruleId, parentRuleId, enforcementMode }).toEqual({
    ruleId: "A-0.1.90.3",
    parentRuleId: "E-0.1.90",
    enforcementMode: "non-deterministic",
  });
  expect(run().ruleId).toBe(ruleId);
});