import { expect, test } from "@jest/globals";
import {
  applicability,
  enforcementMode,
  parentRuleId,
  ruleId,
} from "../../../../src/checks/library/E-0.1.40/E-0.1.40.11.mjs";

test("marks human-review guidance as advisory instead of passing it", () => {
  expect({ ruleId, parentRuleId, enforcementMode, applicability }).toEqual({
    ruleId: "E-0.1.40.11",
    parentRuleId: "E-0.1.40",
    enforcementMode: "non-deterministic",
    applicability: "advisory-only",
  });
});
