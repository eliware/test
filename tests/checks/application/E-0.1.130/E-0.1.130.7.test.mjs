import { expect, test } from "@jest/globals";
import {
  enforcementMode,
  parentRuleId,
  ruleId,
  run,
} from "../../../../src/checks/application/E-0.1.130/E-0.1.130.7.mjs";

test("exports the expected identity for its non-deterministic rule", () => {
  expect({ ruleId, parentRuleId, enforcementMode }).toEqual({
    ruleId: "E-0.1.130.7",
    parentRuleId: "E-0.1.130",
    enforcementMode: "non-deterministic",
  });
  expect(run().ruleId).toBe(ruleId);
});
