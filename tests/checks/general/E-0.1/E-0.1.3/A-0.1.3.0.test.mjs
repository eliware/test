import { expect, test } from "@jest/globals";
import {
  applicability,
  enforcementMode,
  parentRuleId,
  ruleId,
} from "../../../../../src/checks/general/E-0.1/E-0.1.3/A-0.1.3.0.mjs";

test("marks human-review guidance as advisory instead of passing it", () => {
  expect({ ruleId, parentRuleId, enforcementMode, applicability }).toEqual({
    ruleId: "A-0.1.3.0",
    parentRuleId: "E-0.1.3",
    enforcementMode: "non-deterministic",
    applicability: "advisory-only",
  });
});
