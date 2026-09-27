import { expect, test } from "@jest/globals";
import {
  enforcementMode,
  parentRuleId,
  ruleId,
  run,
} from "../../../../src/checks/library/E-0.1.40/E-0.1.40.19.mjs";

test("exports the expected identity for its non-deterministic rule", () => {
  expect({ ruleId, parentRuleId, enforcementMode }).toEqual({
    ruleId: "E-0.1.40.19",
    parentRuleId: "E-0.1.40",
    enforcementMode: "non-deterministic",
  });
  expect(run().ruleId).toBe(ruleId);
});
