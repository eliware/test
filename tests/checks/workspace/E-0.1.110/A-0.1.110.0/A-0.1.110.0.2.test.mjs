import { expect, test } from "@jest/globals";
import {
  applicability,
  enforcementMode,
  parentRuleId,
  ruleId,
} from "../../../../../src/checks/workspace/E-0.1.110/A-0.1.110.0/A-0.1.110.0.2.mjs";

test("marks human-review guidance as advisory instead of passing it", () => {
  expect({ ruleId, parentRuleId, enforcementMode, applicability }).toEqual({
    ruleId: "A-0.1.110.0.2",
    parentRuleId: "A-0.1.110.0",
    enforcementMode: "non-deterministic",
    applicability: "advisory-only",
  });
});
