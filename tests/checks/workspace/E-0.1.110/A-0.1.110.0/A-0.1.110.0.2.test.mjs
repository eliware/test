import { expect, test } from "@jest/globals";
import { enforcementMode, parentRuleId, ruleId, run } from "../../../../../src/checks/workspace/E-0.1.110/A-0.1.110.0/A-0.1.110.0.2.mjs";

test("exports the expected identity for its non-deterministic rule", () => {
  expect({ ruleId, parentRuleId, enforcementMode }).toEqual({
    ruleId: "A-0.1.110.0.2",
    parentRuleId: "A-0.1.110.0",
    enforcementMode: "non-deterministic",
  });
  expect(run().ruleId).toBe(ruleId);
});