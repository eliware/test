import { expect, test } from "@jest/globals";
import {
  applicability,
  enforcementMode,
  parentRuleId,
  ruleId,
} from "../../../../src/checks/infrastructure/E-0.1.90/A-0.1.90.3.mjs";

test("marks human-review guidance as advisory instead of passing it", () => {
  expect({ ruleId, parentRuleId, enforcementMode, applicability }).toEqual({
    ruleId: "A-0.1.90.3",
    parentRuleId: "E-0.1.90",
    enforcementMode: "non-deterministic",
    applicability: "advisory-only",
  });
});
